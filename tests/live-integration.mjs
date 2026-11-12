const checks = [
  {
    name: 'AniList GraphQL',
    url: 'https://graphql.anilist.co',
    method: 'POST',
    headers: {'content-type':'application/json','accept':'application/json'},
    body: JSON.stringify({query:'query { Page(page:1, perPage:1) { media(type:ANIME) { id title { romaji } } } }'}),
    validate: data => Array.isArray(data?.data?.Page?.media) && data.data.Page.media.length > 0
  },
  {
    name: 'Jikan REST',
    url: 'https://api.jikan.moe/v4/top/anime?limit=1',
    validate: data => Array.isArray(data?.data) && data.data.length > 0
  },
  {
    name: 'Kitsu JSON:API',
    url: 'https://kitsu.io/api/edge/anime?page%5Blimit%5D=1&sort=-userCount',
    validate: data => Array.isArray(data?.data) && data.data.length > 0
  },
  {
    name: 'Internet Archive advanced search',
    url: 'https://archive.org/advancedsearch.php?q=collection%3Aanimationandcartoons&fl%5B%5D=identifier&fl%5B%5D=title&rows=1&output=json',
    validate: data => Array.isArray(data?.response?.docs)
  },
  {
    name: 'AnimeSchedule RSS',
    url: 'https://animeschedule.net/subrss.xml',
    raw: true,
    validate: body => /<(rss|feed)(\s|>)/i.test(body)
  }
];

let failed = 0;
for (const check of checks) {
  try {
    const response = await fetch(check.url, {
      method: check.method || 'GET',
      headers: check.headers || {},
      body: check.body,
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const body = await response.text();
    const parsed = check.raw ? body : JSON.parse(body);
    if (!check.validate(parsed)) throw new Error('Response shape did not match expected contract');
    console.log('PASS ' + check.name + ' (' + response.status + ')');
  } catch (error) {
    failed++;
    console.error('FAIL ' + check.name + ': ' + (error?.message || error));
  }
}
console.log('Live integration checks: ' + (checks.length - failed) + '/' + checks.length + ' passed');
if (failed) process.exitCode = 1;
