const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {}, URL };
vm.runInNewContext(fs.readFileSync('source-engine.js', 'utf8'), context);
const engine = context.window.AniMeSourceEngine;

test('central engine exposes the expected catalogue adapters', () => {
  for (const id of ['anilist-graphql','jikan-rest','kitsu-rest','internet-archive','rss-json','website-feed','generic-json','custom-data']) {
    assert.ok(engine.adapters[id], 'missing adapter: ' + id);
  }
});

test('all seven streaming providers remain independently addressable', () => {
  const ids = engine.providers.map(p => p.id);
  assert.deepEqual(Array.from(ids), ['anikoto','animepahe','reanime','donghuazone','donghuanation','animekhor','donghuastream']);
  for (const id of ids) assert.equal(engine.provider(id).id, id);
  assert.equal(engine.provider('unknown-provider'), null);
});

test('URL inference recognizes supported catalogue and feed formats', () => {
  const cases = [
    ['https://graphql.anilist.co', 'anilist-graphql'],
    ['https://api.jikan.moe/v4/top/anime', 'jikan-rest'],
    ['https://kitsu.io/api/edge/anime', 'kitsu-rest'],
    ['https://archive.org/advancedsearch.php?q=animation', 'internet-archive'],
    ['https://animeschedule.net/subrss.xml', 'rss-json'],
    ['https://example.test/feed.xml', 'rss-json'],
    ['https://example.test/', 'website-feed'],
    ['https://example.test/api/catalogue.json', 'generic-json']
  ];
  for (const [url, expected] of cases) assert.equal(engine.infer({url}), expected, url);
});

test('explicit valid adapter selection takes precedence over URL inference', () => {
  assert.equal(engine.infer({url:'https://example.test/data', adapter:'jikan-rest'}), 'jikan-rest');
  assert.equal(engine.infer({url:'https://example.test/data', adapter:'not-real'}), 'generic-json');
});

test('fetch dispatches through the selected adapter and annotates source metadata', async () => {
  const source = {name:'test', url:'https://api.jikan.moe/v4/top/anime'};
  const calls = [];
  const result = await engine.fetch(source, {
    fetchPaged: async s => { calls.push(['paged', s.name]); return [{title:'Test'}]; },
    fetchFeed: async () => { throw new Error('wrong adapter'); },
    fetchImported: async () => { throw new Error('wrong adapter'); }
  });
  assert.equal(source.adapter, 'jikan-rest');
  assert.equal(source.adapterLabel, 'Jikan REST');
  assert.deepEqual(calls, [['paged','test']]);
  assert.equal(result[0].title, 'Test');
});

test('imported data dispatches to the import handler', async () => {
  const source = {name:'pasted', raw:'{"title":"Example"}'};
  const result = await engine.fetch(source, {
    fetchPaged: async () => { throw new Error('wrong adapter'); },
    fetchFeed: async () => { throw new Error('wrong adapter'); },
    fetchImported: async s => [{raw:s.raw}]
  });
  assert.equal(source.adapter, 'custom-data');
  assert.equal(result[0].raw, source.raw);
});
