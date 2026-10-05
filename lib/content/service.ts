import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { SiteContent, DEFAULT_SITE_CONTENT } from './types';

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from('site_content')
      .select('section_key, data');

    if (error || !rows || rows.length === 0) {
      return DEFAULT_SITE_CONTENT;
    }

    // Merge each section from DB over default
    const content: SiteContent = { ...DEFAULT_SITE_CONTENT };
    for (const row of rows) {
      const key = row.section_key as keyof SiteContent;
      if (key && content[key] && row.data) {
        // Deep merge or overwrite section
        ((content as unknown) as Record<string, unknown>)[key] = {
          ...((content[key] as unknown) as Record<string, unknown>),
          ...((row.data as unknown) as Record<string, unknown>),
        };
      }
    }

    return content;
  } catch (err) {
    console.warn('[CMS] Failed to fetch site_content from DB, using defaults:', err);
    return DEFAULT_SITE_CONTENT;
  }
}

export async function updateSectionContent(
  sectionKey: keyof SiteContent,
  data: unknown,
  updatedBy?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('site_content')
      .upsert(
        {
          section_key: sectionKey,
          data,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy || 'admin',
        },
        { onConflict: 'section_key' }
      );

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
