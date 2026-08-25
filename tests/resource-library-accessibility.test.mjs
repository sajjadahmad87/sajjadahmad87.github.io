import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const libraries = [
  'resource-library/laundry.html',
  'resource-library/finishing.html',
  'resource-library/sops.html',
  'resource-library/bowe.html',
];

test('protected resource libraries provide keyboard bypass and labelled landmarks', () => {
  for (const path of libraries) {
    const html = read(path);

    assert.equal((html.match(/class="skip-link"/g) || []).length, 1, `${path} needs one skip link`);
    assert.match(html, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
    assert.equal((html.match(/id="main-content"/g) || []).length, 1, `${path} needs one main target`);
    assert.match(html, /<main id="main-content" tabindex="-1">/);
    assert.match(html, /<nav class="nav-links" aria-label="Primary navigation">/);
    assert.match(html, /href="\.\.\/resources\.html" aria-current="page">Resources<\/a>/);
  }
});

test('shared page styles expose visible focus and high-contrast fallbacks', () => {
  const css = read('pages.css');

  assert.match(css, /:focus-visible\{outline:3px solid var\(--cyan\);outline-offset:3px\}/);
  assert.match(css, /\.skip-link:focus\{transform:translateY\(0\)\}/);
  assert.match(css, /@media\(forced-colors:active\)/);
  assert.match(css, /outline-color:Highlight/);
});
