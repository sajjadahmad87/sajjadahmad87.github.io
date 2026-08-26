import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const root=new URL('../',import.meta.url);
const sitemap=readFileSync(new URL('sitemap.xml',root),'utf8');
const lastmods=new Map([...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(match=>[match[1],match[2]]));
const guides=readdirSync(new URL('guides/',root),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>`guides/${entry.name}/index.html`).sort();

const structuredData=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match=>{
  const value=JSON.parse(match[1]);
  return value['@graph']||[value];
});

test('every indexable guide has matching breadcrumb structured data',()=>{
  for(const file of guides){
    const html=readFileSync(new URL(file,root),'utf8');
    const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical,`${file} requires a canonical URL`);
    assert.match(html,/class="guide-breadcrumb"/,`${file} requires a visible breadcrumb`);
    const breadcrumb=structuredData(html).find(node=>node['@type']==='BreadcrumbList');
    assert.ok(breadcrumb,`${file} requires BreadcrumbList structured data`);
    assert.deepEqual(breadcrumb.itemListElement.map(item=>item.position),[1,2,3]);
    assert.equal(breadcrumb.itemListElement[0].item,'https://sajjadengineeringacademy.com/');
    assert.equal(breadcrumb.itemListElement[1].item,'https://sajjadengineeringacademy.com/guides/');
    assert.equal(breadcrumb.itemListElement[2].item||canonical,canonical);
  }
});

test('guide modification dates match sitemap freshness',()=>{
  for(const file of guides){
    const html=readFileSync(new URL(file,root),'utf8');
    const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    const dated=structuredData(html).find(node=>node.dateModified);
    assert.ok(dated?.dateModified,`${file} requires dateModified structured data`);
    assert.equal(dated.dateModified,lastmods.get(canonical),`${file} dateModified must match sitemap lastmod`);
  }
});
