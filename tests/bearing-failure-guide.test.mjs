import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../guides/bearing-failure/index.html', import.meta.url), 'utf8');
const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

test('bearing guide provides evidence-led diagnosis and verification depth', () => {
  assert.ok(text.split(' ').length >= 1250, 'guide should contain at least 1,250 readable words');
  for (const id of ['learning-path', 'baseline', 'evidence-channels', 'diagnostic-workflow', 'shutdown-inspection', 'correct-and-verify', 'record-fields']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing ${id} section`);
  }
  for (const phrase of ['measurement point', 'operating state', 'competing hypotheses', 'post-repair baseline', 'lubricant', 'vibration', 'temperature']) {
    assert.match(text, new RegExp(phrase, 'i'), `missing evidence concept: ${phrase}`);
  }
});

test('bearing guide preserves safe boundaries and connected learning', () => {
  for (const phrase of ['PTW/LOTO', 'risk assessment', 'OEM manuals', 'competent-person', 'zero energy', 'guarding']) {
    assert.match(text, new RegExp(phrase, 'i'), `missing safety boundary: ${phrase}`);
  }
  assert.match(html, /skf\.com/i);
  assert.match(html, /fluke\.com/i);
  assert.match(html, /ntnamericas\.com/i);
  assert.match(html, /root-cause-analysis-5-why/);
  assert.match(html, /fmea-maintenance/);
  assert.match(html, /ppm-checklist/);
  assert.match(html, /mtbf-mttr-availability-calculator/);
});
