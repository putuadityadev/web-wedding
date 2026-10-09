import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatWhatsAppMessage, normalizeWhatsAppPhone, buildWhatsAppUrl } from '../lib/guests/whatsapp';
import { DEFAULT_SITE_CONTENT } from '../lib/content/types';

describe('WhatsApp Message Formatter & Phone Normalizer', () => {
  test('normalizes Indonesian 08 phone number to 628 for wa.me links', () => {
    assert.equal(normalizeWhatsAppPhone('081234567890'), '6281234567890');
    assert.equal(normalizeWhatsAppPhone('+6281234567890'), '6281234567890');
    assert.equal(normalizeWhatsAppPhone('6281234567890'), '6281234567890');
    assert.equal(normalizeWhatsAppPhone('0812-3456-7890'), '6281234567890');
  });

  test('formats personal WhatsApp message using custom branding template', () => {
    const customContent = {
      ...DEFAULT_SITE_CONTENT,
      hero: {
        ...DEFAULT_SITE_CONTENT.hero,
        groomName: 'Putu',
        brideName: 'Ayu',
      },
      branding: {
        ...DEFAULT_SITE_CONTENT.branding,
        whatsappShareText: 'Om Swastyastu {nama_tamu}, kami mengundang Anda ke pawiwahan {mempelai}. Tautan: {link_undangan}',
      },
    };

    const guest = {
      name: 'I Gede Budi',
      salutation: 'Bapak',
      token: 'abcd1234efgh',
    };

    const formatted = formatWhatsAppMessage(guest, customContent, 'https://example.com');
    assert.equal(
      formatted,
      'Om Swastyastu Bapak I Gede Budi, kami mengundang Anda ke pawiwahan Putu & Ayu. Tautan: https://example.com/u/abcd1234efgh'
    );
  });

  test('falls back gracefully to dynamic default template if custom text is empty', () => {
    const customContent = {
      ...DEFAULT_SITE_CONTENT,
      hero: {
        ...DEFAULT_SITE_CONTENT.hero,
        groomName: 'Putu',
        brideName: 'Ayu',
      },
      branding: {
        ...DEFAULT_SITE_CONTENT.branding,
        whatsappShareText: '',
      },
    };

    const guest = {
      name: 'Aditya',
      token: 'xyz987',
    };

    const formatted = formatWhatsAppMessage(guest, customContent, 'https://example.com');
    assert.ok(formatted.includes('Putu & Ayu'));
    assert.ok(formatted.includes('https://example.com/u/xyz987'));
    assert.ok(!formatted.includes('{mempelai}'));
    assert.ok(!formatted.includes('{nama_tamu}'));
  });

  test('supports double curly braces {{nama}} and {{mempelai}} placeholders', () => {
    const customContent = {
      ...DEFAULT_SITE_CONTENT,
      hero: {
        ...DEFAULT_SITE_CONTENT.hero,
        groomName: 'Rama',
        brideName: 'Sinta',
      },
      branding: {
        ...DEFAULT_SITE_CONTENT.branding,
        whatsappShareText: 'Yth. {{nama_tamu}}, hadir ya ke pernikahan {{mempelai}}: {{link}}',
      },
    };

    const guest = {
      name: 'Budi',
      salutation: 'Bapak',
      token: 'tok123',
    };

    const formatted = formatWhatsAppMessage(guest, customContent, 'https://example.com');
    assert.equal(formatted, 'Yth. Bapak Budi, hadir ya ke pernikahan Rama & Sinta: https://example.com/u/tok123');
  });

  test('builds direct api.whatsapp.com URL preserving 4-byte unicode emojis', () => {
    const textWithEmojis = '💍 Dharma & Luthfi 🗓️ Sabtu, 17 Oktober 2026 📍 Kayubihi 👉 https://example.com';
    const url = buildWhatsAppUrl('081234567890', textWithEmojis);

    assert.ok(url.startsWith('https://api.whatsapp.com/send?phone=6281234567890&text='));
    // Ensure 💍 (%F0%9F%92%8D) and 🗓 (%F0%9F%97%93) are percent-encoded without %EF%BF%BD replacement character
    assert.ok(url.includes('%F0%9F%92%8D'));
    assert.ok(!url.includes('%EF%BF%BD'));
  });
});
