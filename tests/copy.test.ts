import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplate, resolveCopy } from '../lib/copy/render';

describe('Copy Template Renderer', () => {
  test('replaces placeholders correctly', () => {
    const template = 'Halo {{sapaan}} {{panggilan}}, datang ya ke pernikahan {{mempelai}} di {{lokasi}}!';
    const rendered = renderTemplate(template, {
      sapaan: 'Kak',
      panggilan: 'Budi',
      mempelai: 'Aditya & Clarissa',
      lokasi: 'The Glasshouse',
    });

    assert.equal(
      rendered,
      'Halo Kak Budi, datang ya ke pernikahan Aditya & Clarissa di The Glasshouse!'
    );
  });

  test('cleans up empty placeholders without awkward spaces or double punctuation', () => {
    const template = 'Kepada Yth. {{sapaan}} {{nama}}';
    const renderedWithoutSalutation = renderTemplate(template, {
      sapaan: '',
      nama: 'Budi Santoso',
    });

    assert.equal(renderedWithoutSalutation, 'Kepada Yth. Budi Santoso');
  });

  test('falls back to first word of name if panggilan is omitted', () => {
    const template = 'Terima kasih, {{panggilan}}!';
    const rendered = renderTemplate(template, {
      nama: 'Clarissa Maharani',
    });

    assert.equal(rendered, 'Terima kasih, Clarissa!');
  });

  test('resolves copy by tone (formal vs warm vs casual)', () => {
    const formalGreeting = resolveCopy('cover_greeting', 'formal', {
      sapaan: 'Bapak',
      nama: 'Bambang',
    });
    assert.match(formalGreeting, /Kepada Yth/);

    const casualGreeting = resolveCopy('cover_greeting', 'casual', {
      nama: 'Rian Pratama',
      panggilan: 'Rian',
    });
    assert.match(casualGreeting, /Hai, Rian/);
  });
});
