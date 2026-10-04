import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhoneNumber } from '../lib/guests/phone';
import { validateCsvRows } from '../lib/csv/validate';
import { parseCsvString } from '../lib/csv/parse';

describe('Phone Normalization', () => {
  test('normalizes 0812 to +62812', () => {
    assert.equal(normalizePhoneNumber('081234567890'), '+6281234567890');
  });

  test('normalizes 62812 to +62812', () => {
    assert.equal(normalizePhoneNumber('6281234567890'), '+6281234567890');
  });

  test('normalizes Excel dropped zero 812 to +62812', () => {
    assert.equal(normalizePhoneNumber('81234567890'), '+6281234567890');
  });

  test('returns null on invalid phone numbers', () => {
    assert.equal(normalizePhoneNumber('12345'), null);
    assert.equal(normalizePhoneNumber('invalid'), null);
  });
});

describe('CSV Parser and Validator', () => {
  test('parses CSV with aliases and normalizes fields', () => {
    const csvContent = `name,hp,pax,tone\nBudi Santoso,081234567890,2,formal\nDewi Lestari,81987654321,1,casual`;
    const rows = parseCsvString(csvContent);
    const { validCount, errorCount, results } = validateCsvRows(rows);

    assert.equal(validCount, 2);
    assert.equal(errorCount, 0);
    assert.equal(results[0].data?.phone, '+6281234567890');
    assert.equal(results[0].data?.tone, 'formal');
    assert.equal(results[1].data?.phone, '+6281987654321');
    assert.equal(results[1].data?.tone, 'casual');
  });

  test('flags missing name as error', () => {
    const csvContent = `nama,no_hp\n,081234567890`;
    const rows = parseCsvString(csvContent);
    const { validCount, errorCount } = validateCsvRows(rows);

    assert.equal(validCount, 0);
    assert.equal(errorCount, 1);
  });
});
