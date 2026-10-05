import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateGuestToken } from '@/lib/guests/token';
import { normalizePhoneNumber } from '@/lib/guests/phone';

export const dynamic = 'force-dynamic';

interface CsvRowInput {
  nama?: string;
  name?: string;
  no_hp?: string;
  phone?: string;
  wa?: string;
  whatsapp?: string;
  sapaan?: string;
  salutation?: string;
  panggilan?: string;
  nickname?: string;
  grup?: string;
  group?: string;
  maks_tamu?: string | number;
  max_pax?: string | number;
  pax?: string | number;
  nada?: string;
  tone?: string;
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();

    const rawRows: CsvRowInput[] = body.rows || [];
    const duplicateMode: 'skip' | 'update' = body.duplicateMode === 'update' ? 'update' : 'skip';
    const filename: string = body.filename || 'tamu_import.csv';

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Data CSV kosong atau tidak valid' },
        { status: 400 }
      );
    }

    // 1. Create import batch entry
    const { data: batch, error: batchErr } = await admin
      .from('import_batches')
      .insert({
        filename,
        row_count: rawRows.length,
        created_count: 0,
        updated_count: 0,
        skipped_count: 0,
        created_by: adminUser.email,
      })
      .select('id')
      .single();

    if (batchErr || !batch) {
      throw new Error(batchErr?.message || 'Gagal membuat batch import');
    }

    const batchId = batch.id;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // 2. Fetch all existing phones to detect duplicates efficiently
    const { data: existingGuests } = await admin
      .from('guests')
      .select('id, phone')
      .not('phone', 'is', null);

    const existingPhoneMap = new Map<string, string>();
    if (existingGuests) {
      for (const g of existingGuests) {
        if (g.phone) {
          existingPhoneMap.set(g.phone, g.id);
        }
      }
    }

    // 3. Process each row
    const toInsert: Array<Record<string, unknown>> = [];

    for (const row of rawRows) {
      const name = (row.nama || row.name || '').trim();
      if (!name) {
        skippedCount++;
        continue;
      }

      const rawPhone = row.no_hp || row.phone || row.wa || row.whatsapp;
      const cleanPhone = normalizePhoneNumber(rawPhone);

      const rawTone = (row.nada || row.tone || '').toLowerCase().trim();
      const tone = ['formal', 'warm', 'casual'].includes(rawTone) ? rawTone : 'warm';

      const salutation = (row.sapaan || row.salutation || 'Bapak / Ibu').trim();
      const nickname = (row.panggilan || row.nickname || name.split(' ')[0]).trim();
      const groupLabel = (row.grup || row.group || 'Keluarga & Kerabat').trim();
      const maxPax = Number(row.maks_tamu || row.max_pax || row.pax) || 2;

      // Check if phone duplicate exists
      if (cleanPhone && existingPhoneMap.has(cleanPhone)) {
        if (duplicateMode === 'skip') {
          skippedCount++;
          continue;
        } else {
          // Update mode
          const existingId = existingPhoneMap.get(cleanPhone)!;
          await admin
            .from('guests')
            .update({
              name,
              nickname,
              salutation,
              group_label: groupLabel,
              tone,
              max_pax: maxPax,
              import_batch_id: batchId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingId);
          updatedCount++;
          continue;
        }
      }

      // Add to batch insert list
      toInsert.push({
        token: generateGuestToken(),
        name,
        nickname,
        salutation,
        phone: cleanPhone,
        group_label: groupLabel,
        tone,
        max_pax: maxPax,
        source: 'csv',
        import_batch_id: batchId,
      });

      if (cleanPhone) {
        // Track within this batch run to avoid duplicate phones in the same CSV
        existingPhoneMap.set(cleanPhone, 'pending');
      }
    }

    // 4. Batch insert new guests
    if (toInsert.length > 0) {
      // Chunk inserts in sets of 100 for stability
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error: insertErr } = await admin.from('guests').insert(chunk);
        if (insertErr) {
          console.error('[CSV Import] Chunk error:', insertErr);
          throw new Error(insertErr.message);
        }
        createdCount += chunk.length;
      }
    }

    // 5. Update batch summary
    await admin
      .from('import_batches')
      .update({
        created_count: createdCount,
        updated_count: updatedCount,
        skipped_count: skippedCount,
      })
      .eq('id', batchId);

    return NextResponse.json({
      ok: true,
      batchId,
      createdCount,
      updatedCount,
      skippedCount,
      totalProcessed: rawRows.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses import CSV';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
