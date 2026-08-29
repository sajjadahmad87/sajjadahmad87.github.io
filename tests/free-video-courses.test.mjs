import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page=readFileSync(new URL('../free-video-courses.html',import.meta.url),'utf8');
const courses=readFileSync(new URL('../courses.html',import.meta.url),'utf8');
const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');

test('video-course collection has indexable metadata and a crawl path',()=>{
  assert.match(page,/rel="canonical" href="https:\/\/sajjadengineeringacademy\.com\/free-video-courses\.html"/);
  assert.match(page,/name="robots" content="index,follow/);
  assert.match(page,/"@type":"CollectionPage"/);
  assert.match(courses,/href="free-video-courses\.html"/);
  assert.match(sitemap,/https:\/\/sajjadengineeringacademy\.com\/free-video-courses\.html/);
});

test('every curated course is clearly external and links safely to an official provider',()=>{
  assert.equal((page.match(/EXTERNAL FREE LEARNING RESOURCE/g)||[]).length,3);
  assert.match(page,/https:\/\/ocw\.mit\.edu\/courses\/6-002-circuits-and-electronics-spring-2007\//);
  assert.match(page,/https:\/\/nptel\.ac\.in\/courses\/108104140/);
  assert.match(page,/https:\/\/nptel\.ac\.in\/courses\/108105062/);
  assert.equal((page.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,3);
  assert.equal((page.match(/Watch on provider site/g)||[]).length,3);
  assert.match(page,/does not own, accredit, certify or claim affiliation/);
  assert.match(page,/Free learning access does not imply a free certificate/);
});

test('curation supplies original learning context and academy integration',()=>{
  for(const text of ['Prerequisites:','Learning outcomes:','Recommended study use:','Free-access status:']){
    assert.equal((page.match(new RegExp(text,'g'))||[]).length,3);
  }
  for(const path of ['tools/three-phase-power-calculator/','guides/vfd-fundamentals/','quiz-electrical.html#knowledge-check','guides/engineering-glossary/','guides/plc-troubleshooting/','quiz-plc.html#knowledge-check']){
    assert.ok(page.includes(`href="${path}"`));
  }
  assert.match(page,/OEM manuals, PTW\/LOTO, risk assessments/);
  assert.match(page,/Safety functions and interlocks must not be bypassed/);
});
