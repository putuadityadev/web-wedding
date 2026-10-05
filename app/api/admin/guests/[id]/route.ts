import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhoneNumber } from '@/lib/guests/phone';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = await context.params;
    const body = await request.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: 'Nama tamu tidak boleh kosong' },
        { status: 400 }
      );
    }

    const phone = normalizePhoneNumber(body.phone);

    const updatePayload: Record<string, unknown> = {
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
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await admin
      .from('guests')
      .update(updatePayload)
      .eq('id', id)
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

    // If admin also updated RSVP status directly
    if (body.status && (body.status === 'attending' || body.status === 'not_attending')) {
      await admin.from('rsvps').upsert(
        {
          guest_id: id,
          status: body.status,
          pax: body.status === 'attending' ? Number(body.pax) || 1 : 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'guest_id' }
      );
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui data tamu';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = await context.params;

    const { error } = await admin.from('guests').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus tamu';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
