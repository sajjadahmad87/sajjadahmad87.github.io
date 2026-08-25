import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared public styles respect reduced-motion preferences', () => {
  for (const path of ['styles.css', 'pages.css']) {
    const css = read(path);
    assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
    assert.match(css, /animation\s*:\s*none\s*!important/);
    assert.match(css, /transition-duration\s*:\s*\.01ms\s*!important/);
    assert.match(css, /scroll-behavior\s*:\s*auto\s*!important/);
  }
});

