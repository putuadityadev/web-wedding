import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSiteContent, updateSectionContent } from '@/lib/content/service';
import { GalleryItem, GalleryContent } from '@/lib/content/types';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/gallery
 * Mengambil daftar item galeri dengan opsi filter tipe media, pencarian, dan paginasi.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('type'); // 'photo' | 'video' | null
    const search = searchParams.get('q')?.toLowerCase();
    const primaryOnly = searchParams.get('primary') === 'true';

    const content = await getSiteContent();
    const gallery = content.gallery || {
      sectionLabel: 'GALERI KENANGAN',
      sectionTitle: 'Momen Terindah Kami',
      sectionDesc: 'Kilas balik perjalanan cinta dalam frame dokumentasi.',
      items: [],
    };

    let items = gallery.items || [];

    // Filter tipe media
    if (mediaType === 'video') {
      items = items.filter((it) => it.mediaType === 'video' || Boolean(it.videoSrc));
    } else if (mediaType === 'photo') {
      items = items.filter((it) => it.mediaType !== 'video' && !it.videoSrc);
    }

    // Filter slot utama beranda
    if (primaryOnly) {
      items = items.filter((it) => it.isPrimary !== false);
    }

    // Filter pencarian teks
    if (search) {
      items = items.filter(
        (it) =>
          it.title?.toLowerCase().includes(search) ||
          it.label?.toLowerCase().includes(search) ||
          it.category?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        sectionLabel: gallery.sectionLabel,
        sectionTitle: gallery.sectionTitle,
        sectionDesc: gallery.sectionDesc,
        total: items.length,
        items,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}

/**
 * POST /api/admin/gallery
 * Menambahkan satu atau beberapa item baru ke galeri (Batch Create).
 */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { items: newItems, item } = body as {
      items?: Partial<GalleryItem>[];
      item?: Partial<GalleryItem>;
    };

    const itemsToAdd = newItems || (item ? [item] : []);
    if (!itemsToAdd || itemsToAdd.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Tidak ada item yang disertakan untuk ditambahkan' },
        { status: 400 }
      );
    }

    const content = await getSiteContent();
    const currentGallery: GalleryContent = content.gallery || {
      sectionLabel: 'GALERI KENANGAN',
      sectionTitle: 'Momen Terindah Kami',
      sectionDesc: 'Kilas balik perjalanan cinta dalam frame dokumentasi.',
      items: [],
    };

    const preparedItems: GalleryItem[] = itemsToAdd.map((raw, idx) => {
      const isVideo = raw.mediaType === 'video' || Boolean(raw.videoSrc);
      return {
        id: raw.id || `gal_${Date.now()}_${nanoid(6)}_${idx}`,
        label: raw.label || (isVideo ? 'MOMEN VIDEO' : 'DOKUMENTASI'),
        type: raw.type || (raw.aspectRatio === '16/10' || raw.aspectRatio === '16/9' ? 'landscape' : 'portrait'),
        title: raw.title || (isVideo ? 'Video Kenangan' : 'Momen Berharga'),
        aspectRatio: raw.aspectRatio || (isVideo ? '16/9' : '4/5'),
        src: raw.src || raw.videoSrc || '',
        mediaType: isVideo ? 'video' : 'photo',
        videoSrc: raw.videoSrc,
        posterSrc: raw.posterSrc,
        isPrimary: raw.isPrimary ?? false,
        category: raw.category || (isVideo ? 'Video' : 'Prewedding'),
      };
    });

    // Tambahkan item baru di urutan teratas (paling baru)
    const updatedGallery: GalleryContent = {
      ...currentGallery,
      items: [...preparedItems, ...currentGallery.items],
    };

    const saveResult = await updateSectionContent('gallery', updatedGallery, admin.email);
    if (!saveResult.ok) {
      return NextResponse.json({ ok: false, error: saveResult.error }, { status: 500 });
    }

    // Revalidasi cache rute publik & admin
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/preview', 'page');
      revalidatePath('/admin/content', 'page');
      revalidatePath('/admin/gallery', 'page');
    } catch (e) {
      console.warn('[Gallery] Revalidate warning:', e);
    }

    return NextResponse.json({
      ok: true,
      addedCount: preparedItems.length,
      items: preparedItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menambahkan media ke galeri';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/gallery
 * Memperbarui item galeri (edit data, ubah urutan, atau toggle slot beranda).
 */
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { items, item, sectionMeta } = body as {
      items?: GalleryItem[];
      item?: Partial<GalleryItem> & { id: string | number };
      sectionMeta?: { sectionLabel?: string; sectionTitle?: string; sectionDesc?: string };
    };

    const content = await getSiteContent();
    const currentGallery: GalleryContent = content.gallery || {
      sectionLabel: 'GALERI KENANGAN',
      sectionTitle: 'Momen Terindah Kami',
      sectionDesc: 'Kilas balik perjalanan cinta dalam frame dokumentasi.',
      items: [],
    };

    let updatedItems = [...currentGallery.items];

    // Kasus 1: Reorder atau update seluruh list
    if (Array.isArray(items)) {
      updatedItems = items;
    }
    // Kasus 2: Update item spesifik berdasarkan ID
    else if (item && item.id !== undefined) {
      const idx = updatedItems.findIndex((it) => String(it.id) === String(item.id));
      if (idx !== -1) {
        updatedItems[idx] = {
          ...updatedItems[idx],
          ...item,
        };
      } else {
        return NextResponse.json({ ok: false, error: 'Item tidak ditemukan' }, { status: 404 });
      }
    }

    const updatedGallery: GalleryContent = {
      ...currentGallery,
      ...(sectionMeta || {}),
      items: updatedItems,
    };

    const saveResult = await updateSectionContent('gallery', updatedGallery, admin.email);
    if (!saveResult.ok) {
      return NextResponse.json({ ok: false, error: saveResult.error }, { status: 500 });
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/preview', 'page');
      revalidatePath('/admin/content', 'page');
      revalidatePath('/admin/gallery', 'page');
    } catch (e) {
      console.warn('[Gallery] Revalidate warning:', e);
    }

    return NextResponse.json({ ok: true, gallery: updatedGallery });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui galeri';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/gallery?id=...
 * Menghapus item dari galeri berdasarkan ID.
 */
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Parameter id wajib disertakan' }, { status: 400 });
    }

    const content = await getSiteContent();
    const currentGallery = content.gallery || {
      sectionLabel: 'GALERI KENANGAN',
      sectionTitle: 'Momen Terindah Kami',
      sectionDesc: '',
      items: [],
    };

    const prevCount = currentGallery.items.length;
    const remainingItems = currentGallery.items.filter((it) => String(it.id) !== String(id));

    if (remainingItems.length === prevCount) {
      return NextResponse.json({ ok: false, error: 'Item tidak ditemukan' }, { status: 404 });
    }

    const updatedGallery: GalleryContent = {
      ...currentGallery,
      items: remainingItems,
    };

    const saveResult = await updateSectionContent('gallery', updatedGallery, admin.email);
    if (!saveResult.ok) {
      return NextResponse.json({ ok: false, error: saveResult.error }, { status: 500 });
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/preview', 'page');
      revalidatePath('/admin/content', 'page');
      revalidatePath('/admin/gallery', 'page');
    } catch (e) {
      console.warn('[Gallery] Revalidate warning:', e);
    }

    return NextResponse.json({ ok: true, deletedId: id, remainingCount: remainingItems.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus item galeri';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
