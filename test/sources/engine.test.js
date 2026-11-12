'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const code = fs.readFileSync(path.resolve(__dirname, '../../src/sources/engine.js'), 'utf8');
function engine() {
  const window = {};
  vm.runInNewContext(code, { window, URL });
  return window.AniMeSourceEngine;
}

test('infers each central catalog adapter from a representative source URL', () => {
  const sourceEngine = engine();
  const cases = [
    ['https://graphql.anilist.co', 'anilist-graphql'],
    ['https://api.jikan.moe/v4/top/anime', 'jikan-rest'],
    ['https://kitsu.io/api/edge/anime', 'kitsu-rest'],
    ['https://archive.org/advancedsearch.php?q=animation', 'internet-archive'],
    ['https://example.test/feed.xml', 'rss-json'],
    ['https://example.test/', 'website-feed'],
    ['https://example.test/api/catalog', 'generic-json']
  ];
  for (const [url, id] of cases) assert.equal(sourceEngine.infer({ url }), id);
  assert.equal(sourceEngine.infer({ raw: '[{"title":"Pasted"}]' }), 'custom-data');
});

test('keeps all fifteen provider shortcuts individually registered', () => {
  const ids = engine().listProviders().map(provider => provider.id);
  for (const id of [
    'anikoto', 'animepahe', 'reanime', 'donghuazone', 'donghuanation', 'animekhor',
    'donghuastream', 'aniworld', 'kickassanime', 'anime4up', 'animesama', 'latanime',
    'mugiwara', 'justanime', 'animeav1'
  ]) assert.ok(ids.includes(id), `missing provider ${id}`);
  assert.equal(ids.length, 15);
});

test('routes inferred catalog loads through the shared transport callbacks', async () => {
  const sourceEngine = engine(), calls = [];
  const api = {
    fetchPaged: async source => { calls.push(['paged', source.url]); return [{ title: 'Example' }]; },
    fetchFeed: async source => { calls.push(['feed', source.url]); return [{ title: 'Feed title' }]; },
    fetchImported: async source => { calls.push(['imported', source.raw]); return [{ title: 'Imported' }]; }
  };
  assert.equal((await sourceEngine.load({ url: 'https://api.jikan.moe/v4/top/anime' }, api))[0].title, 'Example');
  assert.equal((await sourceEngine.load({ url: 'https://example.test/' }, api))[0].title, 'Feed title');
  assert.equal((await sourceEngine.load({ raw: 'sample' }, api))[0].title, 'Imported');
  assert.deepEqual(calls.map(call => call[0]), ['paged', 'feed', 'imported']);
});

test('retains inferred adapter identity and source label in merged title provenance', async () => {
  const sourceEngine = engine();
  const source = { name: 'Jikan source', url: 'https://api.jikan.moe/v4/top/anime' };
  source.items = await sourceEngine.load(source, {
    fetchPaged: async () => [{ title: 'Example Anime', link: 'https://example.test/title' }]
  });
  const catalog = sourceEngine.mergeCatalog([source], value => String(value).toLowerCase(), value => Number(value) || 0);
  assert.equal(catalog.list[0].from[0].src, 'Jikan source');
  assert.equal(catalog.list[0].from[0].adapterId, 'jikan-rest');
  assert.equal(source.adapterLabel, 'Jikan REST');
});

