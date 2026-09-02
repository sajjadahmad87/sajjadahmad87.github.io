import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const publicFiles = [
  'README.md',
  'index.html',
  'courses.html',
  'free-video-courses.html',
];

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(location);
    return entry.isFile() && entry.name.endsWith('.html') ? [location] : [];
  });
}

test('public learning content preserves the removed dedicated-system exclusion', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'downloads', 'chiller')), false);
  const files = publicFiles.map(file => path.join(ROOT, file)).concat(collectHtml(path.join(ROOT, 'guides')));
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /chiller|rtag/i, path.relative(ROOT, file));
  }
});
