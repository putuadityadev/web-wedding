import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateGuestToken } from '@/lib/guests/token';
import { normalizePhoneNumber } from '@/lib/guests/phone';

export const dynamic = 'force-dynamic';

function extractBlastTimestamp(internalNote?: string | null): string | null {
  if (!internalNote) return null;
  const match = internalNote.match(/\[BLASTED:([^\]]+)\]/);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const group = searchParams.get('group') || '';
    const status = searchParams.get('status') || '';
    const batchId = searchParams.get('batchId') || '';

    let query = admin
      .from('guests')
      .select('*, rsvps(id, status, pax, wish, updated_at)')
      .order('created_at', { ascending: false });

    if (batchId) {
      query = query.eq('import_batch_id', batchId);
    }

    if (group && group !== 'ALL') {
      query = query.eq('group_label', group);
    }

    const { data: rawGuests, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let guestList = (rawGuests || []).map((row: any) => {
      const rsvp = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
      const guestStatus: 'attending' | 'not_attending' | 'pending' = rsvp?.status || 'pending';
      const guestPax: number = rsvp?.pax !== undefined ? rsvp.pax : 0;

      return {
        id: row.id,
        name: row.name,
        nickname: row.nickname || row.name.split(' ')[0],
        salutation: row.salutation || 'Bapak / Ibu',
        phone: row.phone || '',
        groupLabel: row.group_label || 'Keluarga & Kerabat',
        tone: (row.tone as 'formal' | 'warm' | 'casual') || 'warm',
        maxPax: row.max_pax || 2,
        arrivalAt: row.arrival_at || null,
        status: guestStatus,
        pax: guestPax,
        openCount: row.open_count || 0,
        token: row.token,
        internalNote: row.internal_note || '',
        importBatchId: row.import_batch_id || null,
        lastBlastedAt: extractBlastTimestamp(row.internal_note),
        createdAt: row.created_at,
      };
    });

    // Apply text search
    if (search) {
      guestList = guestList.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.phone.includes(search) ||
          g.groupLabel.toLowerCase().includes(search) ||
          g.token.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (status && status !== 'ALL') {
      guestList = guestList.filter((g) => g.status === status);
    }

    // Extract unique groups
    const uniqueGroups = Array.from(
      new Set((rawGuests || []).map((g) => g.group_label).filter(Boolean))
    );

    return NextResponse.json({
      ok: true,
      data: guestList,
      groups: uniqueGroups,
      total: guestList.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data tamu';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: 'Nama tamu tidak boleh kosong' },
        { status: 400 }
      );
    }

    const phone = normalizePhoneNumber(body.phone);
    const token = generateGuestToken();

    const newGuestRow = {
      token,
      name,
      nickname: body.nickname?.trim() || name.split(' ')[0],
      salutation: body.salutation?.trim() || 'Bapak / Ibu',
      phone,
      group_label: body.groupLabel?.trim() || 'Keluarga & Kerabat',
      tone: body.tone || 'warm',
      max_pax: Number(body.maxPax) || 2,
      arrival_at: body.arrivalAt || null,
      custom_message: body.customMessage?.trim() || null,
      internal_note: body.internalNote?.trim() || null,
      source: 'manual',
    };

    const { data: inserted, error } = await admin
      .from('guests')
      .insert(newGuestRow)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('guests_phone_uniq')) {
        return NextResponse.json(
          { ok: false, error: 'Nomor WhatsApp sudah digunakan oleh tamu lain' },
          { status: 400 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: inserted.id,
        name: inserted.name,
        nickname: inserted.nickname,
        salutation: inserted.salutation,
        phone: inserted.phone || '',
        groupLabel: inserted.group_label,
        tone: inserted.tone,
        maxPax: inserted.max_pax,
        arrivalAt: inserted.arrival_at,
        status: 'pending',
        pax: 0,
        openCount: 0,
        token: inserted.token,
        internalNote: inserted.internal_note || '',
        lastBlastedAt: null,
        createdAt: inserted.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat tamu baru';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json().catch(() => ({}));
    const { ids, group } = body as { ids?: string[]; group?: string };

    const hasIds = Array.isArray(ids) && ids.length > 0;
    const hasGroup = typeof group === 'string' && group.trim().length > 0;

    if (!hasIds && !hasGroup) {
      return NextResponse.json(
        { ok: false, error: 'Pilih minimal satu tamu atau grup yang ingin dihapus' },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    if (hasIds) {
      // First clean up associated RSVPs for strict foreign key integrity
      await admin.from('rsvps').delete().in('guest_id', ids!);

      const { data, error } = await admin
        .from('guests')
        .delete()
        .in('id', ids!)
        .select('id');

      if (error) {
        throw new Error(error.message);
      }
      deletedCount = data?.length ?? ids!.length;
    } else if (hasGroup) {
      // Find IDs belonging to this group
      const { data: guestsInGroup } = await admin
        .from('guests')
        .select('id')
        .eq('group_label', group!.trim());

      const groupIds = (guestsInGroup || []).map((g) => g.id);
      if (groupIds.length > 0) {
        await admin.from('rsvps').delete().in('guest_id', groupIds);
      }

      const { data, error } = await admin
        .from('guests')
        .delete()
        .eq('group_label', group!.trim())
        .select('id');

      if (error) {
        throw new Error(error.message);
      }
      deletedCount = data?.length ?? 0;
    }

    return NextResponse.json({
      ok: true,
      count: deletedCount,
      message: `Berhasil menghapus ${deletedCount} tamu undangan`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus tamu massal';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

