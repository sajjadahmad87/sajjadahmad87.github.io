import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const rootPath=new URL('../',import.meta.url).pathname;
const origin='https://sajjadengineeringacademy.com';
const walk=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  if(['.git','node_modules'].includes(entry.name))return [];
  const path=join(directory,entry.name);
  return entry.isDirectory()?walk(path):[path];
});
const htmlFiles=walk(rootPath).filter(path=>path.endsWith('.html'));
const sitemapText=['sitemap.xml','blog-sitemap.xml']
  .map(file=>readFileSync(join(rootPath,file),'utf8'))
  .join('\n');
const sitemapUrls=[...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const sitemapSet=new Set(sitemapUrls);

const canonicalFrom=html=>html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
const urlToFile=url=>{
  const pathname=decodeURIComponent(new URL(url,origin).pathname);
  if(pathname==='/')return join(rootPath,'index.html');
  const local=join(rootPath,pathname.slice(1));
  return pathname.endsWith('/')?join(local,'index.html'):local;
};

test('sitemap exactly matches self-canonical indexable HTML pages',()=>{
  const canonicalPages=[];
  for(const file of htmlFiles){
    const html=readFileSync(file,'utf8');
    const canonical=canonicalFrom(html);
    const noindex=/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html);
    if(canonical&&!noindex)canonicalPages.push({file,canonical});
  }
  assert.equal(new Set(canonicalPages.map(page=>page.canonical)).size,canonicalPages.length,'indexable canonicals must be unique');
  assert.deepEqual(new Set(canonicalPages.map(page=>page.canonical)),sitemapSet,'sitemap and indexable canonicals must match');
  for(const {file,canonical} of canonicalPages){
    assert.equal(resolve(file),resolve(urlToFile(canonical)),`${relative(rootPath,file)} must be self-canonical`);
  }
});

test('static internal links and public assets resolve to repository files',()=>{
  for(const pageUrl of sitemapUrls){
    const file=urlToFile(pageUrl);
    const html=readFileSync(file,'utf8');
    for(const match of html.matchAll(/<(?:a|link|script|img|source)\b[^>]*(?:href|src)="([^"]+)"/gi)){
      const raw=match[1];
      if(/^(?:mailto:|tel:|javascript:|data:|#)/i.test(raw))continue;
      const target=new URL(raw,pageUrl);
      if(target.origin!==origin)continue;
      const targetFile=urlToFile(target);
      assert.ok(existsSync(targetFile),`${relative(rootPath,file)} links to missing ${target.pathname}`);
    }
  }
});

test('every non-home sitemap page has a static crawl path from another indexable page',()=>{
  const incoming=new Map(sitemapUrls.map(url=>[url,new Set()]));
  for(const sourceUrl of sitemapUrls){
    const html=readFileSync(urlToFile(sourceUrl),'utf8');
    for(const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)){
      const raw=match[1];
      if(/^(?:mailto:|tel:|javascript:|data:|#)/i.test(raw))continue;
      const target=new URL(raw,sourceUrl);
      target.hash='';
      if(target.origin===origin&&target.href!==sourceUrl&&incoming.has(target.href))incoming.get(target.href).add(sourceUrl);
    }
  }
  for(const url of sitemapUrls.filter(url=>url!==`${origin}/`)){
    assert.ok(incoming.get(url).size>0,`${url} has no static internal crawl path`);
  }
});
