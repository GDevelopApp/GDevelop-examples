// @ts-check
const fs = require('fs').promises;
const path = require('path');

const getFilters = async () => {
  const filtersJson = await fs.readFile(
    path.join(__dirname, '../../dist/database/filters.json')
  );
  const filters = JSON.parse(filtersJson.toString());
  return filters;
};

describe('filters.json post build checks', () => {
  test('defaultTags', async () => {
    const filters = await getFilters();

    // Check tags contain the extensions.
    expect(filters.defaultTags).toContain('Top-down movement');
    expect(filters.defaultTags).toContain('Draggable Behavior');
    expect(filters.defaultTags).toContain('Physics Engine 2.0');

    // Check tags don't contain extensions for which there are no examples.
    expect(filters.defaultTags).not.toContain('Physics Engine (deprecated)');
});
});
