import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pages = [
  'guides/ahu-troubleshooting/index.html',
  'guides/bearing-failure/index.html',
  'guides/compressor-oil-carryover/index.html',
  'guides/engineering-glossary/index.html',
  'guides/fmea-maintenance/index.html',
  'guides/index.html',
  'guides/mtbf/index.html',
  'guides/mttr/index.html',
  'guides/ppm-checklist/index.html',
  'guides/preventive-maintenance/index.html',
  'guides/root-cause-analysis-5-why/index.html',
  'guides/steam-trap/index.html',
  'guides/vfd-fundamentals/index.html',
  'resources/mtbf-mttr-data-collection-worksheet/index.html',
  'tools/energy-cost-payback-calculator/index.html',
  'tools/index.html',
  'tools/mtbf-mttr-availability-calculator/index.html',
  'tools/three-phase-power-calculator/index.html'
];

test('guide pages load only the self-contained guide stylesheet', () => {
  for (const path of pages) {
    const html = readFileSync(new URL(path, root), 'utf8');
    assert.doesNotMatch(html, /href="(?:\.\.\/)+styles\.css"/, path);
    assert.match(html, /href="(?:\.\.\/)+guide\.css"/, path);
  }
});

test('guide pages expose complete large social preview metadata', () => {
  const imageUrl = 'https://sajjadengineeringacademy.com/social-preview.png';
  for (const path of pages) {
    const html = readFileSync(new URL(path, root), 'utf8');
    assert.match(html, /<meta property="og:site_name" content="Sajjad's Engineering Academy">/, path);
    assert.match(html, new RegExp(`<meta property="og:image" content="${imageUrl}">`), path);
    assert.match(html, /<meta property="og:image:type" content="image\/png">/, path);
    assert.match(html, /<meta property="og:image:width" content="1200">/, path);
    assert.match(html, /<meta property="og:image:height" content="630">/, path);
    assert.match(html, /<meta property="og:image:alt" content="[^"]+">/, path);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, path);
    assert.match(html, /<meta name="twitter:title" content="[^"]+">/, path);
    assert.match(html, /<meta name="twitter:description" content="[^"]+">/, path);
    assert.match(html, new RegExp(`<meta name="twitter:image" content="${imageUrl}">`), path);
    assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/, path);
    assert.equal((html.match(/property="og:image"/g) || []).length, 1, path);
    assert.equal((html.match(/name="twitter:image"/g) || []).length, 1, path);
  }

  const image = readFileSync(new URL('social-preview.png', root));
  assert.equal(image.subarray(1, 4).toString(), 'PNG');
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test('guide stylesheet includes the required shared foundation', () => {
  const css = readFileSync(new URL('guide.css', root), 'utf8');
  assert.match(css, /\.guide-body,\.guide-body \*\{box-sizing:border-box\}/);
  assert.match(css, /\.guide-body\{[^}]*margin:0[^}]*font-family:/);
  assert.match(css, /\.guide-body a\{color:inherit;text-decoration:none\}/);
  assert.match(css, /\.guide-body button,\.guide-body input,\.guide-body select\{font:inherit\}/);
});

test('guide back links do not target the removed homepage curriculum fragment', () => {
  for (const path of pages) {
    const html = readFileSync(new URL(path, root), 'utf8');
    assert.doesNotMatch(html, /href="(?:\.\.\/)+#curriculum"/, path);
  }
});

test('preventive maintenance guide preserves risk-based progression and safeguards', () => {
  const html = readFileSync(new URL('guides/preventive-maintenance/index.html', root), 'utf8');
  for (const id of ['strategy-workflow', 'task-selection', 'condition-monitoring', 'frequency-review', 'learning-path']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /Beginner → Intermediate → Advanced progression/);
  assert.match(html, /permit-to-work and lockout\/tagout requirements/);
  assert.match(html, /href="\.\.\/ppm-checklist\/"/);
  assert.match(html, /href="\.\.\/fmea-maintenance\/"/);
  assert.match(html, /href="\.\.\/\.\.\/free-video-courses\.html#reliability-path"/);
  assert.match(html, /"dateModified":"2026-08-30"/);
  assert.doesNotMatch(html, /chiller/i);
});
