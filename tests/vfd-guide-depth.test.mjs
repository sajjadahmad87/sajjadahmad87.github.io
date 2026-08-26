import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guide=readFileSync(new URL('../guides/vfd-fundamentals/index.html',import.meta.url),'utf8');

test('VFD guide provides commissioning, diagnosis and controlled-change depth',()=>{
  for(const id of ['trip-evidence','common-trips','commissioning-checklist','troubleshooting-sequence','parameter-control']){
    assert.match(guide,new RegExp(`id="${id}"`));
  }
  assert.match(guide,/Supply path:/);
  assert.match(guide,/Command path:/);
  assert.match(guide,/Preserve trip evidence before resetting/);
  assert.match(guide,/Controlled VFD commissioning checklist/);
  assert.match(guide,/Control parameter changes/);
  assert.match(guide,/never apply an insulation-resistance test through connected drive electronics/i);
});

test('VFD guide maintains safe progression into measurement and assessment',()=>{
  assert.match(guide,/Approved site procedures, OEM discharge-time instructions, PTW\/LOTO, risk assessments, test-before-touch/);
  assert.match(guide,/href="\.\.\/\.\.\/tools\/three-phase-power-calculator\/#phase-measurement-evidence"/);
  assert.match(guide,/href="\.\.\/\.\.\/quiz-electrical\.html#knowledge-check"/);
  assert.match(guide,/"dateModified":"2026-08-26"/);
});
