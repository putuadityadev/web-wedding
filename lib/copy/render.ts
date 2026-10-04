import { Tone } from '@/lib/guests/view';
import { CopyKey, DEFAULT_COPY_TEMPLATES } from './defaults';

export interface CopyContext {
  sapaan?: string | null;
  nama?: string | null;
  panggilan?: string | null;
  tanggal?: string | null;
  jam_hadir?: string | null;
  lokasi?: string | null;
  link?: string | null;
  mempelai?: string | null;
}

/**
 * Replace placeholders in template with context values.
 * Placeholders without values are cleanly removed without leaving orphan double-spaces or undefined/null.
 */
export function renderTemplate(template: string, ctx: CopyContext): string {
  if (!template) return '';

  const values: Record<string, string> = {
    sapaan: ctx.sapaan?.trim() || '',
    nama: ctx.nama?.trim() || '',
    panggilan: ctx.panggilan?.trim() || (ctx.nama ? ctx.nama.trim().split(/\s+/)[0] : '') || '',
    tanggal: ctx.tanggal?.trim() || '',
    jam_hadir: ctx.jam_hadir?.trim() || '',
    lokasi: ctx.lokasi?.trim() || '',
    link: ctx.link?.trim() || '',
    mempelai: ctx.mempelai?.trim() || '',
  };

  // Replace each {{key}}
  let result = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return values[key] ?? '';
  });

  // Clean up double spaces or awkward spacing caused by empty placeholders
  result = result
    .split('\n')
    .map((line) => {
      // Clean duplicate spaces and spaces before punctuation like comma/period
      return line
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+([,.:;?!])/g, '$1')
        .trim();
    })
    .join('\n')
    .trim();

  // If any {{...}} remains, remove it
  result = result.replace(/\{\{[^}]+\}\}/g, '').trim();

  return result;
}

/**
 * Resolve copy based on priority:
 * 1. customMessage (only for personal_message)
 * 2. copy_templates with key + tone
 * 3. copy_templates with key + tone = 'any'
 * 4. Hardcoded default
 */
export function resolveCopy(
  key: CopyKey,
  tone: Tone,
  ctx: CopyContext,
  customMessage?: string | null,
  overrideTemplate?: string | null
): string {
  if (key === 'cover_greeting' && customMessage) {
    return renderTemplate(customMessage, ctx);
  }

  const template =
    overrideTemplate ||
    DEFAULT_COPY_TEMPLATES[key]?.[tone] ||
    DEFAULT_COPY_TEMPLATES[key]?.['warm'] ||
    '';

  return renderTemplate(template, ctx);
}
