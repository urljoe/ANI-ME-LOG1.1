'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const engineCode = fs.readFileSync(path.join(root, 'src/sources/engine.js'), 'utf8');
const adapterCode = fs.readFileSync(path.join(root, 'src/sources/adapters/animeschedule-rss.js'), 'utf8');

function makeRecord(overrides = {}) {
  return {
    title: 'Example Anime',
    raw: 'Episode 1 of Example Anime is out!',
    ep: '1',
    link: 'https://animeschedule.net/entry/example',
    video: '',
    ...overrides
  };
}

function setup() {
  const window = {};
  const context = vm.createContext({ window, URL });
  vm.runInContext(engineCode, context, { filename: 'src/sources/engine.js' });
  vm.runInContext(adapterCode, context, { filename: 'src/sources/adapters/animeschedule-rss.js' });

  const fetched = [];
  const parsed = [];
  const adapter = window.createAnimeScheduleRSSAdapter({
    fetchItems: async source => {
      fetched.push(source.url);
      return [makeRecord()];
    },
    parseText: raw => {
      parsed.push(raw);
      return [makeRecord()];
    }
  });
  window.AniMeSourceEngine.registerAdapter(adapter);
  return { engine: window.AniMeSourceEngine, adapter, fetched, parsed };
}

test('matches only the configured AnimeSchedule RSS feeds', () => {
  const { adapter } = setup();
  assert.equal(adapter.matches({ url: 'https://animeschedule.net/subrss.xml' }), true);
  assert.equal(adapter.matches({ url: 'https://animeschedule.net/dubrss.xml' }), true);
  assert.equal(adapter.matches({ url: 'https://animeschedule.net/jpnrss.xml' }), true);
  assert.equal(adapter.matches({ url: 'https://example.test/subrss.xml' }), false);
  assert.equal(adapter.matches({ url: 'https://animeschedule.net/api/private' }), false);
});

test('loads configured feeds and pasted data through the shared parsing contract', async () => {
  const { engine, fetched, parsed } = setup();
  const feed = { name: 'AnimeSchedule · Sub', url: 'https://animeschedule.net/subrss.xml', adapterId: 'animeschedule-rss' };
  const fromFeed = await engine.load(feed);
  const fromPaste = await engine.load({ ...feed, raw: '<rss>sample</rss>' });
  assert.equal(fromFeed.length, 1);
  assert.equal(fetched[0], feed.url);
  assert.equal(fromPaste.length, 1);
  assert.equal(parsed[0], '<rss>sample</rss>');
});

test('merges duplicate titles while keeping each feed label and adapter provenance', () => {
  const { engine } = setup();
  const sources = [
    { name: 'AnimeSchedule · Sub', adapterId: 'animeschedule-rss', items: [makeRecord()] },
    { name: 'AnimeSchedule · Dub', adapterId: 'animeschedule-rss', items: [makeRecord({ link: 'https://animeschedule.net/entry/example-dub', ep: '2' })] }
  ];
  const catalog = engine.mergeCatalog(sources, value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(), value => Number.parseFloat(value) || 0);
  assert.equal(catalog.list.length, 1);
  assert.equal(catalog.list[0].from.length, 2);
  assert.deepEqual(Array.from(catalog.list[0].from, item => item.src), ['AnimeSchedule · Sub', 'AnimeSchedule · Dub']);
  assert.equal(catalog.list[0].from[0].adapterId, 'animeschedule-rss');
  assert.equal(catalog.list[0].from[1].link, 'https://animeschedule.net/entry/example-dub');
});

test('resolves to the original item page when no video URL is supplied', () => {
  const { engine } = setup();
  const record = { ...makeRecord(), src: 'AnimeSchedule · Sub', adapterId: 'animeschedule-rss' };
  const resolved = engine.resolveSource(record);
  assert.equal(resolved.type, 'page');
  assert.equal(resolved.src, record.link);
  assert.equal(resolved.attribution, record.src);
});

test('keeps a direct media URL and its source-page fallback when a record provides both', () => {
  const { adapter } = setup();
  const resolved = adapter.resolve({
    ...makeRecord({ video: 'https://cdn.example.test/episode-1.mp4' }),
    src: 'AnimeSchedule · Sub'
  });
  assert.equal(resolved.type, 'media');
  assert.equal(resolved.src, 'https://cdn.example.test/episode-1.mp4');
  assert.equal(resolved.fallbackUrl, 'https://animeschedule.net/entry/example');
  assert.equal(resolved.attribution, 'AnimeSchedule · Sub');
});

test('rejects unsafe source links', () => {
  const { adapter } = setup();
  assert.equal(adapter.resolve({ link: 'javascript:alert(1)' }), null);
});

