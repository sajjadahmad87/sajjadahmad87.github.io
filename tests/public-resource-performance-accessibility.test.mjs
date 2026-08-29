import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const root=new URL('../',import.meta.url);
const resourceRoot=new URL('resources/',root);
const pages=readdirSync(resourceRoot,{withFileTypes:true})
  .filter(entry=>entry.isDirectory())
  .map(entry=>`resources/${entry.name}/index.html`)
  .sort();

test('public worksheet pages use one accessible Resources hierarchy',()=>{
  assert.equal(pages.length,5,'Expected all five indexable worksheet pages to be audited');
  for(const path of pages){
    const html=readFileSync(new URL(path,root),'utf8');
    assert.match(html,/<a class="skip-link" href="#main-content">Skip to main content<\/a>/,path);
    assert.match(html,/<main id="main-content"[^>]*tabindex="-1">/,path);
    assert.match(html,/<nav class="guide-breadcrumb" aria-label="Breadcrumb">[^<]*<a href="\.\.\/\.\.\/"/,path);
    assert.match(html,/href="\.\.\/\.\.\/resources\.html">Engineering Resources<\/a>/,path);
    assert.equal((html.match(/<h1>/g)||[]).length,1,`${path} must have one h1`);
    assert.match(html,/<article>/,path);

    const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
    const breadcrumb=blocks.find(block=>block['@type']==='BreadcrumbList');
    const resource=blocks.find(block=>block['@type']==='LearningResource');
    assert.ok(breadcrumb,`${path} requires BreadcrumbList data`);
    assert.ok(resource,`${path} requires LearningResource data`);
    assert.equal(breadcrumb.itemListElement[1].name,'Engineering Resources',path);
    assert.equal(breadcrumb.itemListElement[1].item,'https://sajjadengineeringacademy.com/resources.html',path);
    const expectedModified=path.includes('plc-fault-evidence-worksheet')?'2026-08-29':'2026-08-26';
    assert.equal(resource.dateModified,expectedModified,path);
  }
});

test('public worksheet pages retain a lean static-page budget',()=>{
  for(const path of pages){
    const html=readFileSync(new URL(path,root),'utf8');
    assert.ok(Buffer.byteLength(html)<20000,`${path} exceeds the 20 KB HTML budget`);
    assert.equal((html.match(/<link[^>]+rel="stylesheet"/g)||[]).length,1,`${path} must load one stylesheet`);
    assert.match(html,/href="\.\.\/\.\.\/guide\.css"/,path);
    assert.ok((html.match(/<script[^>]+src=/g)||[]).length<=1,`${path} loads unnecessary external scripts`);
    assert.doesNotMatch(html,/<(?:img|video|iframe)\b/i,`${path} should remain media-free`);
  }
});
