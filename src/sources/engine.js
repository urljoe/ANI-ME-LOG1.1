/* Shared source registry and adapter boundary for Ani-Me Log.
 * Site-specific catalogue and stream extraction stays disabled until a provider
 * documents a supported feed/API or authorized playback integration.
 */
(function (root) {
  'use strict';

  const adapters = new Map();
  const providers = new Map();
  const version = '1.2.1';

  function registerAdapter(adapter) {
    if (!adapter || !adapter.id || (typeof adapter.load !== 'function' && typeof adapter.resolve !== 'function')) {
      throw new TypeError('A source adapter needs an id and a load(source) or resolve(source) function.');
    }
    if (adapters.has(adapter.id)) {
      throw new Error('Source adapter already registered: ' + adapter.id);
    }
    adapters.set(adapter.id, Object.freeze({ ...adapter, label: adapter.label || adapter.id }));
  }

  function registerProvider(provider) {
    if (!provider || !provider.id || !provider.name) {
      throw new TypeError('A provider needs an id and name.');
    }
    if (providers.has(provider.id)) {
      throw new Error('Provider already registered: ' + provider.id);
    }
    providers.set(provider.id, Object.freeze({
      id: provider.id,
      name: provider.name,
      kind: provider.kind || 'website-shortcut',
      adapterId: provider.adapterId || 'website-shortcut',
      capabilities: Object.freeze({
        catalogue: false,
        episodes: false,
        directVideo: false,
        embed: 'provider-controlled',
        ...(provider.capabilities || {})
      })
    }));
  }

  function listProviders() {
    return [...providers.values()].map(provider => ({
      ...provider,
      capabilities: { ...provider.capabilities }
    }));
  }

  function getProvider(id) {
    return providers.get(id) || null;
  }

  function adapterFor(source) {
    if (source && source.adapterId && adapters.has(source.adapterId)) {
      return adapters.get(source.adapterId);
    }
    if (source && source.adapter && adapters.has(source.adapter)) {
      return adapters.get(source.adapter);
    }
    for (const adapter of adapters.values()) {
      if (typeof adapter.matches === 'function' && adapter.matches(source)) return adapter;
    }
    const inferred = infer(source);
    return adapters.get(inferred) || adapters.get('generic-json') || null;
  }

  function infer(source) {
    let url;
    try { url = new URL(source && source.url || ''); } catch (_) { return 'custom-data'; }
    const host = url.hostname.toLowerCase(), path = url.pathname + url.search;
    if (/graphql\.anilist\.co$/.test(host)) return 'anilist-graphql';
    if (/api\.jikan\.moe$/.test(host)) return 'jikan-rest';
    if (/kitsu\.io$/.test(host)) return 'kitsu-rest';
    if (/archive\.org$/.test(host)) return 'internet-archive';
    if (/\.xml$|rss|feed|\.rss$/i.test(path)) return 'rss-json';
    if (url.pathname === '/' && !url.search) return 'website-feed';
    return 'generic-json';
  }

  function listAdapters() {
    return [...adapters.values()].map(adapter => ({ id: adapter.id, label: adapter.label, family: adapter.family || 'custom' }));
  }

  async function load(source, api = {}) {
    const adapter = adapterFor(source);
    if (!adapter) throw new Error('No source adapter is registered for this source.');
    if (typeof adapter.load !== 'function') throw new Error('This adapter does not load catalogue data.');
    if (source) source.adapterLabel = adapter.label;
    const items = await adapter.load(source, api);
    if (!Array.isArray(items)) throw new TypeError('A source adapter must return an array of normalized title records.');
    return items;
  }

  function resolveSource(source) {
    const adapter = adapterFor(source);
    if (adapter && adapter.id !== 'website-shortcut' && typeof adapter.resolve === 'function') {
      return adapter.resolve(source);
    }
    const video = source && source.video || '';
    const link = source && source.link || '';
    const url = video || link;
    return url ? { type: video ? 'media' : 'page', src: url, fallbackUrl: link, attribution: source && source.src || '' } : null;
  }

  function mergeCatalog(sources, normalizeTitle, numericValue) {
    const m = new Map(), keys = new Map();
    const addKey = (key, entry) => {
      if (!key) return;
      const old = keys.get(key);
      if (old && old !== entry) return old;
      keys.set(key, entry);
      m.set(entry.k, entry);
      return entry;
    };

    (Array.isArray(sources) ? sources : []).forEach(source => (source.items || []).forEach((item, index) => {
      const names = [item.title, ...(item.aliases || [])].filter(Boolean);
      const normalizedNames = [...new Set(names.map(normalizeTitle).filter(key => key.length >= 4))];
      const found = normalizedNames.map(key => keys.get(key)).find(Boolean);
      const primary = normalizeTitle(item.title);
      if (!primary) return;

      let entry = found;
      if (!entry) {
        entry = {
          k: primary, title: item.title, image: item.image, ep: item.ep, date: item.date || 0,
          ord: index, desc: '', tags: [], total: 0, score: 0, aliases: [], from: []
        };
        m.set(entry.k, entry);
      } else if (item.title && item.title.length > entry.title.length && (!entry.title || entry.title.length < 4)) {
        entry.title = item.title;
      }

      entry.image = entry.image || item.image;
      if (numericValue(item.ep) > numericValue(entry.ep)) entry.ep = item.ep;
      entry.date = Math.max(entry.date, item.date || 0);
      entry.ord = Math.min(entry.ord, index);
      if ((item.desc || '').length > entry.desc.length) entry.desc = item.desc;
      (item.tags || []).forEach(tag => { if (tag && !entry.tags.includes(tag)) entry.tags.push(tag); });
      entry.total = Math.max(entry.total, item.total || 0);
      entry.score = Math.max(entry.score, item.score || 0);

      names.forEach(name => {
        if (name && normalizeTitle(name) !== normalizeTitle(entry.title) && !entry.aliases.includes(name)) {
          entry.aliases.push(name);
        }
        addKey(normalizeTitle(name), entry);
      });

      const raw = item.raw || item.title, video = item.video || '';
      const adapterId = (adapterFor(source) || {}).id || source.adapterId || source.adapter || '';
      if (!entry.from.some(record =>
        record.src === source.name && record.raw === raw && record.ep === item.ep &&
        record.link === item.link && record.video === video
      )) {
        entry.from.push({ src: source.name, raw, ep: item.ep, link: item.link, video, sub: item.sub || [], adapterId });
      }
      addKey(primary, entry);
    }));

    return { map: m, list: [...m.values()].sort((a, b) => a.title.localeCompare(b.title)) };
  }

  function validateWebsite(value) {
    let url;
    try { url = new URL(String(value || '').trim()); } catch (_) {
      throw new Error('Enter a valid provider website address.');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Provider addresses must use HTTP or HTTPS.');
    }
    return url.href;
  }

  function resolve(providerId, value) {
    const provider = getProvider(providerId);
    if (!provider) throw new Error('Unknown provider: ' + providerId);
    const adapter = adapters.get(provider.adapterId);
    if (!adapter || typeof adapter.resolve !== 'function') throw new Error('No playback adapter is registered for this provider.');
    return adapter.resolve({ url: validateWebsite(value), providerId: provider.id });
  }

  registerAdapter({
    id: 'website-shortcut',
    load() {
      throw new Error('Website shortcuts do not provide automatic catalogue or stream extraction.');
    },
    resolve(source) {
      const url = validateWebsite(source && source.url);
      return { type: 'page', src: url, providerId: source.providerId || '' };
    }
  });

  const paged = (id, label, family = 'catalogue') => registerAdapter({
    id, label, family, load: (source, api) => api.fetchPaged(source)
  });
  paged('anilist-graphql', 'AniList GraphQL');
  paged('jikan-rest', 'Jikan REST');
  paged('kitsu-rest', 'Kitsu REST');
  paged('internet-archive', 'Internet Archive');
  paged('rss-json', 'RSS / JSON feed', 'feed');
  registerAdapter({ id: 'website-feed', label: 'Website feed discovery', family: 'feed', load: (source, api) => api.fetchFeed(source) });
  paged('generic-json', 'Generic JSON / API');
  registerAdapter({ id: 'custom-data', label: 'Imported / pasted data', family: 'import', load: (source, api) => api.fetchImported(source) });

  [
    ['anikoto', 'AniKoto'],
    ['animepahe', 'AnimePahe'],
    ['reanime', 'ReAnime'],
    ['donghuazone', 'DonghuaZone'],
    ['donghuanation', 'DonghuaNation'],
    ['animekhor', 'AnimeKhor'],
    ['donghuastream', 'DonghuaStream'],
    ['aniworld', 'AniWorld'],
    ['kickassanime', 'KickAssAnime'],
    ['anime4up', 'Anime4Up'],
    ['animesama', 'Anime-Sama'],
    ['latanime', 'Latanime'],
    ['mugiwara', 'Mugiwara'],
    ['justanime', 'JustAnime'],
    ['animeav1', 'AnimeAV1']
  ].forEach(([id, name]) => registerProvider({
    id, name, kind: 'website-shortcut', adapterId: 'website-shortcut'
  }));

  root.AniMeSourceEngine = Object.freeze({
    version,
    registerAdapter,
    registerProvider,
    listAdapters,
    listProviders,
    getProvider,
    adapterFor,
    infer,
    resolve,
    resolveSource,
    load,
    mergeCatalog,
    validateWebsite
  });
})(window);

