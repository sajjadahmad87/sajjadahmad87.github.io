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
  assert.doesNotMatch(html, /chiller/i);
});
