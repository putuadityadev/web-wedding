import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateGuestToken } from '@/lib/guests/token';
import { normalizePhoneNumber } from '@/lib/guests/phone';

export const dynamic = 'force-dynamic';

interface CsvRowInput {
  [key: string]: unknown;
  nama?: string;
  name?: string;
  nama_lengkap?: string;
  nama_tamu?: string;
  guest_name?: string;
  guest?: string;
  no_hp?: string;
  no_hp_wa?: string;
  phone?: string;
  wa?: string;
  whatsapp?: string;
  nomor_hp?: string;
  nomor?: string;
  nohp?: string;
  hp?: string;
  kontak?: string;
  telepon?: string;
  telp?: string;
  no_telp?: string;
  no_telepon?: string;
  mobile?: string;
  sapaan?: string;
  salutation?: string;
  gelar?: string;
  title?: string;
  panggilan?: string;
  nickname?: string;
  nama_panggilan?: string;
  grup?: string;
  group?: string;
  kategori?: string;
  category?: string;
  rombongan?: string;
  maks_tamu?: string | number;
  max_pax?: string | number;
  pax?: string | number;
  jumlah_tamu?: string | number;
  kuota?: string | number;
  nada?: string;
  tone?: string;
}

function extractFieldValue(row: CsvRowInput, aliases: string[]): string {
  for (const alias of aliases) {
    const val = row[alias];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
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
    let withPhoneCount = 0;
    let withoutPhoneCount = 0;
    let invalidPhoneCount = 0;

    // 2. Fetch all existing guests to detect duplicates efficiently (by phone and by name)
    const { data: existingGuests } = await admin
      .from('guests')
      .select('id, name, group_label, phone');

    const existingPhoneMap = new Map<string, string>();
    const existingNameMap = new Map<string, string>(); // lowercase name + '::' + lowercase group

    if (existingGuests) {
      for (const g of existingGuests) {
        if (g.phone) {
          existingPhoneMap.set(g.phone, g.id);
        }
        if (g.name) {
          const key = `${g.name.toLowerCase().trim()}::${(g.group_label || '').toLowerCase().trim()}`;
          existingNameMap.set(key, g.id);
        }
      }
    }

    // 3. Process each row
    const toInsert: Array<Record<string, unknown>> = [];

    for (const row of rawRows) {
      const name = extractFieldValue(row, [
        'nama',
        'name',
        'nama_lengkap',
        'nama_tamu',
        'guest_name',
        'guest',
      ]);
      if (!name) {
        skippedCount++;
        continue;
      }

      const rawPhone = extractFieldValue(row, [
        'cleanphone',
        'clean_phone',
        'no_hp',
        'no_hp_wa',
        'phone',
        'wa',
        'whatsapp',
        'nomor_hp',
        'nomor',
        'nohp',
        'hp',
        'kontak',
        'telepon',
        'telp',
        'no_telp',
        'no_telepon',
        'mobile',
        'no_wa',
      ]);
      const cleanPhone = normalizePhoneNumber(rawPhone);

      if (rawPhone && !cleanPhone) {
        invalidPhoneCount++;
      }

      const rawTone = extractFieldValue(row, ['nada', 'tone']).toLowerCase();
      const tone = ['formal', 'warm', 'casual'].includes(rawTone) ? rawTone : 'warm';

      const salutation =
        extractFieldValue(row, ['sapaan', 'salutation', 'gelar', 'title']) || 'Bapak / Ibu';
      const nickname =
        extractFieldValue(row, ['panggilan', 'nickname', 'nama_panggilan']) || name.split(' ')[0];
      const groupLabel =
        extractFieldValue(row, ['grup', 'group', 'kategori', 'category', 'rombongan']) ||
        'Keluarga & Kerabat';
      const rawPax = extractFieldValue(row, [
        'maks_tamu',
        'max_pax',
        'pax',
        'jumlah_tamu',
        'kuota',
      ]);
      const maxPax = Number(rawPax) > 0 ? Number(rawPax) : 2;

      // Duplicate detection key
      const nameKey = `${name.toLowerCase()}::${groupLabel.toLowerCase()}`;
      const duplicateById =
        (cleanPhone && existingPhoneMap.get(cleanPhone)) ||
        existingNameMap.get(nameKey);

      if (duplicateById) {
        if (duplicateMode === 'skip') {
          skippedCount++;
          continue;
        } else {
          // Update mode: update existing guest record (including phone if available)
          const updatePayload: Record<string, unknown> = {
            name,
            nickname,
            salutation,
            group_label: groupLabel,
            tone,
            max_pax: maxPax,
            import_batch_id: batchId,
            updated_at: new Date().toISOString(),
          };

          if (cleanPhone) {
            updatePayload.phone = cleanPhone;
          }

          await admin
            .from('guests')
            .update(updatePayload)
            .eq('id', duplicateById);

          if (cleanPhone) {
            existingPhoneMap.set(cleanPhone, duplicateById);
            withPhoneCount++;
          } else {
            withoutPhoneCount++;
          }

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
        phone: cleanPhone || null,
        group_label: groupLabel,
        tone,
        max_pax: maxPax,
        source: 'csv',
        import_batch_id: batchId,
      });

      if (cleanPhone) {
        withPhoneCount++;
        // Track within this batch run to avoid duplicate phones in the same CSV
        existingPhoneMap.set(cleanPhone, 'pending');
      } else {
        withoutPhoneCount++;
      }
      existingNameMap.set(nameKey, 'pending');
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
      withPhoneCount,
      withoutPhoneCount,
      invalidPhoneCount,
      totalProcessed: rawRows.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses import CSV';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
