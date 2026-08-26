import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root=new URL('../',import.meta.url);
const walk=directory=>readdirSync(directory).flatMap(name=>{
  const entry=join(directory,name);
  return statSync(entry).isDirectory()&&!entry.includes('/.git')?walk(entry):[entry];
});

test('every public data table has a caption, scoped headers and named scroll region',()=>{
  const files=walk(root.pathname).filter(file=>file.endsWith('.html'));
  let count=0;
  for(const file of files){
    const html=readFileSync(file,'utf8');
    for(const match of html.matchAll(/<div class="table-wrap"([^>]*)>\s*(<table>[\s\S]*?<\/table>)\s*<\/div>/g)){
      count++;
      const [,attributes,table]=match;
      assert.match(attributes,/role="region"/,`${file} table wrapper requires a region role`);
      assert.match(attributes,/aria-label="[^"]+"/,`${file} table wrapper requires an accessible name`);
      assert.match(attributes,/tabindex="0"/,`${file} table wrapper must be keyboard scrollable`);
      assert.match(table,/<caption>[^<]+<\/caption>/,`${file} table requires a caption`);
      const headerRow=table.match(/<thead>[\s\S]*?<\/thead>/)?.[0]||'';
      assert.doesNotMatch(headerRow,/<th\b(?![^>]*scope="col")/,`${file} column headers require scope=col`);
      const bodyRows=[...table.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].flatMap(body=>[...body[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row=>row[1]));
      for(const row of bodyRows) assert.match(row,/^<th scope="row">/,`${file} body rows require a scoped row header`);
    }
  }
  assert.equal(count,4,'Expected all four public technical tables to be audited');
});

test('shared guide styles provide responsive table scrolling and visible captions',()=>{
  const css=readFileSync(new URL('guide.css',root),'utf8');
  assert.match(css,/\.guide-body \.table-wrap\{[^}]*overflow-x:auto/);
  assert.match(css,/\.guide-body \.table-wrap table\{[^}]*min-width:600px/);
  assert.match(css,/\.guide-body \.table-wrap caption\{/);
});
