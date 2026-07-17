import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBibtex } from '../src/lib/publications';

test('normalises, sorts and preserves optional publication data', () => {
  const result = parseBibtex(`
    @misc{older, title={Older}, author={Doe, Jane}, year={2020}}
    @article{newer, title={Newer}, author={Pablo Sanchez-Serrano and Doe, Jane},
      year={2025}, selected={true}, code={https://example.com/code},
      doi={https://doi.org/10.1000/example}}
    @misc{undated, title={Undated}, author={Doe, Jane}}
  `);
  assert.deepEqual(
    result.map((item) => item.id),
    ['newer', 'older', 'undated'],
  );
  assert.equal(result[0].selected, true);
  assert.equal(result[0].authors[1].display, 'Jane Doe');
  assert.equal(result[0].doi, '10.1000/example');
  assert.equal(result[2].year, undefined);
});

test('fails clearly for invalid BibTeX', () => {
  assert.throws(() => parseBibtex('@article{broken, title={Missing closing brace}'), /unclosed/);
  assert.throws(
    () => parseBibtex('@article{missing, title={No author}}'),
    /requires title and author/,
  );
});

test('preserves unsupported entry types as other', () => {
  const [entry] = parseBibtex('@thesis{x, title={Thesis}, author={Doe, Jane}, year={2024}}');
  assert.equal(entry.type, 'other');
  assert.equal(entry.sourceType, 'thesis');
});
