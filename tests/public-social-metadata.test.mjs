import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const origin = 'https://sajjadengineeringacademy.com';

const contentValue = (html, attribute, key) => {
  const match = html.match(new RegExp(`<meta ${attribute}="${key}" content="([^"]+)">`));
  return match?.[1];
};

test('every sitemap page has a complete canonical large-card social preview', () => {
  const sitemap = readFileSync(new URL('sitemap.xml', root), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/sajjadengineeringacademy\.com[^<]*)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0, 'sitemap must contain public pages');

  for (const pageUrl of urls) {
    const pathname = new URL(pageUrl).pathname;
    const path = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
    const html = readFileSync(new URL(path, root), 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const ogTitle = contentValue(html, 'property', 'og:title');
    const ogDescription = contentValue(html, 'property', 'og:description');

    assert.equal(canonical, pageUrl, `${path}: canonical`);
    assert.ok(ogTitle, `${path}: og:title`);
    assert.ok(ogDescription, `${path}: og:description`);
    assert.ok(contentValue(html, 'property', 'og:type'), `${path}: og:type`);
    assert.equal(contentValue(html, 'property', 'og:url'), pageUrl, `${path}: og:url`);
    assert.equal(contentValue(html, 'property', 'og:site_name'), "Sajjad's Engineering Academy", `${path}: og:site_name`);
    assert.equal(contentValue(html, 'property', 'og:image'), `${origin}/social-preview.png`, `${path}: og:image`);
    assert.equal(contentValue(html, 'property', 'og:image:type'), 'image/png', `${path}: og:image:type`);
    assert.equal(contentValue(html, 'property', 'og:image:width'), '1200', `${path}: og:image:width`);
    assert.equal(contentValue(html, 'property', 'og:image:height'), '630', `${path}: og:image:height`);
    assert.ok(contentValue(html, 'property', 'og:image:alt'), `${path}: og:image:alt`);
    assert.equal(contentValue(html, 'name', 'twitter:card'), 'summary_large_image', `${path}: twitter:card`);
    assert.equal(contentValue(html, 'name', 'twitter:title'), ogTitle, `${path}: twitter:title`);
    assert.equal(contentValue(html, 'name', 'twitter:description'), ogDescription, `${path}: twitter:description`);
    assert.equal(contentValue(html, 'name', 'twitter:image'), `${origin}/social-preview.png`, `${path}: twitter:image`);
    assert.ok(contentValue(html, 'name', 'twitter:image:alt'), `${path}: twitter:image:alt`);
  }
});
