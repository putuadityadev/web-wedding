import test from 'node:test';
import assert from 'node:assert/strict';

interface GuestMock {
  id: string;
  name: string;
  groupLabel: string;
}

test('Guest Selection & Bulk Delete Logic', async (t) => {
  const sampleGuests: GuestMock[] = [
    { id: 'g-1', name: 'Wayan Dharma', groupLabel: 'Keluarga Pria' },
    { id: 'g-2', name: 'Made Laksmi', groupLabel: 'Keluarga Pria' },
    { id: 'g-3', name: 'Nyoman Artha', groupLabel: 'Teman Kantor' },
    { id: 'g-4', name: 'Ketut Sari', groupLabel: 'Teman Kantor' },
    { id: 'g-5', name: 'Gede Adi', groupLabel: 'Sahabat SMA' },
  ];

  await t.test('selects and deselects all guests belonging to a specific group', () => {
    let selectedIds: string[] = [];

    // Select group "Keluarga Pria"
    const targetGroup = 'Keluarga Pria';
    const groupGuests = sampleGuests.filter((g) => g.groupLabel === targetGroup);
    const groupGuestIds = groupGuests.map((g) => g.id);

    // Toggle on
    selectedIds = Array.from(new Set([...selectedIds, ...groupGuestIds]));
    assert.deepEqual(selectedIds, ['g-1', 'g-2']);

    // Check if group is fully selected
    const allSelected = groupGuestIds.every((id) => selectedIds.includes(id));
    assert.equal(allSelected, true);

    // Toggle off
    selectedIds = selectedIds.filter((id) => !groupGuestIds.includes(id));
    assert.deepEqual(selectedIds, []);
  });

  await t.test('aggregates group stats accurately with partial and full selections', () => {
    const selectedIds = ['g-1', 'g-3', 'g-4'];

    const map = new Map<string, { total: number; selected: number }>();
    sampleGuests.forEach((g) => {
      const entry = map.get(g.groupLabel) || { total: 0, selected: 0 };
      entry.total += 1;
      if (selectedIds.includes(g.id)) {
        entry.selected += 1;
      }
      map.set(g.groupLabel, entry);
    });

    const keluargaPria = map.get('Keluarga Pria');
    assert.equal(keluargaPria?.total, 2);
    assert.equal(keluargaPria?.selected, 1); // Partial selection

    const temanKantor = map.get('Teman Kantor');
    assert.equal(temanKantor?.total, 2);
    assert.equal(temanKantor?.selected, 2); // Full selection

    const sahabatSma = map.get('Sahabat SMA');
    assert.equal(sahabatSma?.total, 1);
    assert.equal(sahabatSma?.selected, 0); // None selected
  });

  await t.test('filters remaining guests after bulk deletion by IDs', () => {
    const idsToDelete = ['g-1', 'g-2'];
    const deleteSet = new Set(idsToDelete);

    const remaining = sampleGuests.filter((g) => !deleteSet.has(g.id));
    assert.equal(remaining.length, 3);
    assert.equal(remaining.some((g) => g.groupLabel === 'Keluarga Pria'), false);
  });

  await t.test('filters remaining guests after group deletion', () => {
    const groupToDelete = 'Teman Kantor';
    const remaining = sampleGuests.filter((g) => g.groupLabel !== groupToDelete);
    assert.equal(remaining.length, 3);
    assert.equal(remaining.some((g) => g.groupLabel === 'Teman Kantor'), false);
  });

  await t.test('validates payload requirements for bulk delete API', () => {
    const validateDeletePayload = (payload: { ids?: string[]; group?: string }) => {
      const hasIds = Array.isArray(payload.ids) && payload.ids.length > 0;
      const hasGroup = typeof payload.group === 'string' && payload.group.trim().length > 0;
      return hasIds || hasGroup;
    };

    assert.equal(validateDeletePayload({ ids: ['g-1'] }), true);
    assert.equal(validateDeletePayload({ group: 'Keluarga' }), true);
    assert.equal(validateDeletePayload({ ids: [] }), false);
    assert.equal(validateDeletePayload({ group: '   ' }), false);
    assert.equal(validateDeletePayload({}), false);
  });
});
