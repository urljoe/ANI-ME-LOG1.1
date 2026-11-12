/* Ani-Me Log central source engine.
 * Every catalogue source uses one adapter contract; every streaming shortcut remains
 * independently configurable. This layer normalizes source routing, not provider access.
 */
(function (root) {
  'use strict';

  const STREAM_PROVIDERS = [
    { id: 'anikoto', name: 'AniKoto', mode: 'website', capability: 'shortcut' },
    { id: 'animepahe', name: 'AnimePahe', mode: 'website', capability: 'shortcut' },
    { id: 'reanime', name: 'ReAnime', mode: 'website', capability: 'shortcut' },
    { id: 'donghuazone', name: 'DonghuaZone', mode: 'website', capability: 'shortcut' },
    { id: 'donghuanation', name: 'DonghuaNation', mode: 'website', capability: 'shortcut' },
    { id: 'animekhor', name: 'AnimeKhor', mode: 'website', capability: 'shortcut' },
    { id: 'donghuastream', name: 'DonghuaStream', mode: 'website', capability: 'shortcut' }
  ];

  const adapters = Object.create(null);
  function register(adapter) {
    if (!adapter || !adapter.id || typeof adapter.fetch !== 'function') {
      throw new TypeError('A source adapter needs an id and fetch function.');
    }
    adapters[adapter.id] = Object.freeze(adapter);
  }

  function infer(source) {
    if (source && source.adapter && adapters[source.adapter]) return source.adapter;
    let url;
    try { url = new URL(source && source.url || ''); } catch (_) { return 'custom-data'; }
    const host = url.hostname.toLowerCase();
    if (/graphql\\.anilist\\.co$/.test(host)) return 'anilist-graphql';
    if (/api\\.jikan\\.moe$/.test(host)) return 'jikan-rest';
    if (/kitsu\\.io$/.test(host)) return 'kitsu-rest';
    if (/archive\\.org$/.test(host)) return 'internet-archive';
    if (/\\.xml$|rss|feed|\\.rss$/i.test(url.pathname + url.search)) return 'rss-json';
    if (url.pathname === '/' && !url.search) return 'website-feed';
    return 'generic-json';
  }

  register({ id: 'anilist-graphql', label: 'AniList GraphQL', family: 'catalogue', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'jikan-rest', label: 'Jikan REST', family: 'catalogue', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'kitsu-rest', label: 'Kitsu REST', family: 'catalogue', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'internet-archive', label: 'Internet Archive', family: 'catalogue', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'rss-json', label: 'RSS / JSON feed', family: 'feed', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'website-feed', label: 'Website feed discovery', family: 'feed', fetch: (s, api) => api.fetchFeed(s) });
  register({ id: 'generic-json', label: 'Generic JSON / API', family: 'catalogue', fetch: (s, api) => api.fetchPaged(s) });
  register({ id: 'custom-data', label: 'Imported / pasted data', family: 'import', fetch: (s, api) => api.fetchImported(s) });

  function adapterFor(source) {
    const id = infer(source);
    return adapters[id] || adapters['generic-json'];
  }

  async function fetchSource(source, api) {
    if (!source) throw new TypeError('Missing source configuration.');
    const adapter = adapterFor(source);
    source.adapter = adapter.id;
    source.adapterLabel = adapter.label;
    return adapter.fetch(source, api);
  }

  function provider(id) {
    return STREAM_PROVIDERS.find(p => p.id === id) || null;
  }

  root.AniMeSourceEngine = Object.freeze({
    version: '1.2.0',
    adapters,
    providers: STREAM_PROVIDERS,
    infer,
    adapterFor,
    fetch: fetchSource,
    provider
  });
})(window);
