import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const libraries = [
  ['resource-library/laundry.html', 11],
  ['resource-library/finishing.html', 6],
  ['resource-library/sops.html', 40],
  ['resource-library/bowe.html', 3],
];

test('every presentation download exposes its provenance and safety scope', () => {
  let totalDownloads = 0;

  for (const [path, expectedDownloads] of libraries) {
    const html = read(path);
    const downloads = html.match(/href="[^"]+\.pptx"[^>]*\bdownload\b[^>]*>/g) || [];
    const described = downloads.filter((link) => /aria-describedby="download-scope"/.test(link));

    assert.equal(downloads.length, expectedDownloads, `${path} download inventory changed`);
    assert.equal(described.length, downloads.length, `${path} has an undescribed download link`);
    assert.equal((html.match(/id="download-scope"/g) || []).length, 1, `${path} needs one scope notice`);
    assert.match(html, /not (?:controlled OEM manuals|approved site SOPs)/);
    assert.match(html, /PTW\/LOTO/);
    assert.match(html, /competenc(?:e|y|t-person)/);
    totalDownloads += downloads.length;
  }

  assert.equal(totalDownloads, 60);
});

test('SOP downloads cannot be presented as approved work controls', () => {
  const html = read('resource-library/sops.html');
  assert.match(html, /not approved site SOPs, method statements, risk assessments, permits/);
  assert.match(html, /current controlled site procedure and OEM instructions/);
  assert.match(html, /supervision, competency and emergency controls take priority/);
});
