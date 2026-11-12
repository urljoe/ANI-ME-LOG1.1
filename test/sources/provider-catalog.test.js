'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const code = fs.readFileSync(path.resolve(__dirname, '../../src/sources/adapters/provider-catalog.js'), 'utf8');
class MockDOMParser {
  parseFromString() {
    const image = {
      getAttribute(name) { return ({ alt: 'Sample Catalog Title', src: '/poster.jpg' })[name] || ''; }
    };
    const anchor = {
      getAttribute(name) { return ({ href: '/watch/sample-title', title: 'Sample Catalog Title' })[name] || ''; },
      querySelector(selector) { return selector === 'img' ? image : null; }
    };
    return { querySelectorAll: () => [anchor] };
  }
}

function createAdapter(fetchText) {
  const window = {};
  vm.runInNewContext(code, { window, URL, DOMParser: MockDOMParser, Date });
  return window.createProviderCatalogAdapter({ fetchText });
}

test('registers the ten requested catalog providers with individual definitions', () => {
  const adapter = createAdapter(async () => '[]');
  const ids = ['anikoto','animepahe','aniworld','kickassanime','anime4up','animesama','latanime','mugiwara','justanime','animeav1'];
  for (const id of ids) assert.ok(adapter.provider(id), `missing provider ${id}`);
  assert.equal(adapter.provider('animepahe').name, 'AnimePahe');
  assert.equal(adapter.capabilities.directVideo, false);
});

test('normalizes public HTML catalog cards and preserves their provider pages', async () => {
  const requests = [];
  const adapter = createAdapter(async url => { requests.push(url); return '<html></html>'; });
  const ids = ['anikoto','aniworld','kickassanime','anime4up','animesama','latanime','mugiwara','animeav1'];
  for (const id of ids) {
    const provider = adapter.provider(id), origin = `https://${provider.host}`;
    const records = await adapter.load({ providerId: id, adapterId: 'provider-catalog', url: `${origin}/` });
    assert.equal(requests.at(-1), `${origin}${provider.path}`);
    assert.equal(records[0].title, 'Sample Catalog Title');
    assert.equal(new URL(records[0].link).origin, origin);
    assert.equal(records[0].image, `${origin}/poster.jpg`);
  }
});

test('maps AnimePahe public posts to episode pages and numbers', async () => {
  const adapter = createAdapter(async () => JSON.stringify([{
    title: { rendered: 'Sample Anime Episode 12 English Subbed' },
    link: 'https://animepahe.ch/anime/sample-episode-12',
    date_gmt: '2026-01-02T00:00:00'
  }]));
  const records = await adapter.load({ providerId: 'animepahe', adapterId: 'provider-catalog', url: 'https://animepahe.ch/' });
  assert.equal(records[0].title, 'Sample Anime');
  assert.equal(records[0].ep, '12');
  assert.equal(records[0].link, 'https://animepahe.ch/anime/sample-episode-12');
  assert.deepEqual(Array.from(records[0].sub), ['SUB']);
});

test('maps JustAnime public catalog data to original provider pages', async () => {
  const requests = [];
  const adapter = createAdapter(async url => {
    requests.push(url);
    return JSON.stringify({ trending: [{ id: 42, title: 'Sample Anime', poster: 'https://img.example/poster.jpg' }] });
  });
  const records = await adapter.load({ providerId: 'justanime', adapterId: 'provider-catalog', url: 'https://justanime.to/' });
  assert.equal(requests[0], 'https://core.justanime.to/api/home');
  assert.equal(records[0].link, 'https://justanime.to/anime/42');
  assert.equal(records[0].image, 'https://img.example/poster.jpg');
});

