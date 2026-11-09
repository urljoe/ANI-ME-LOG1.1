# Ani-Me Log

A single-page viewer that reads any number of sources (JSON or RSS/Atom feeds) and lists what they contain.
Titles found in more than one source are merged quietly in the background.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (no install, no build step) |
| `sources.json` | Sources loaded for everyone who opens the site |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `icon.svg`, `icon-192.png`, `icon-512.png` | The petal app icon |

## Put it on GitHub

1. Create a public repository.
2. **Add file → Upload files**: drag in the files themselves (not a folder), then commit.
3. **Settings → Pages**: Deploy from a branch, `main`, `/ (root)`.
4. Your site is at `https://YOUR-USERNAME.github.io/REPO-NAME/` after a minute or two.

## Using it

- **Home**: hero banner and rows (Latest, Watchlist, History, one row per source).
- **Click a title** to open its synopsis page: score, genres, sub/dub labels, episode picker, last watched, bookmark with a tag (Plan to watch, Watching, Completed, Dropped) and recommendations.
- **Episodes you open turn dim** so you can see what you’ve watched. Videos play in a window inside the app.
- **Settings**: layout (Auto, Windows, Mobile, TV), quick-add catalogues, your sources, watchlist export/import and network options.

## Sources

- Quick add: AniList, Jikan (MyAnimeList data), Kitsu, AnimeSchedule release feeds and an Internet Archive collection. Catalogue sources load several pages each, so you get hundreds of titles.
- Any site, feed or JSON address can be added. A bare site address (like `donghuazone.com`) finds its own feed.
- Source entries can use `__PAGE__` and `__OFFSET__` in the address, with `pages`, `size`, `gap` and `body` fields (see `sources.json`).

## If a source won’t load

Some sites block direct requests from a web page. By default the app retries a blocked source in the background through public proxies and remembers the one that works. You can turn that off or add your own proxy in **Settings → Network**. **Remove failed sources** in Settings clears out anything that still can’t load.

## Watchlist backup

**Settings → Watchlist backup** exports your watchlist and progress, and imports this app’s file, a JSON list of titles, or a text file with one title per line.

## Layouts

Wrapped apps can force a layout by loading `index.html?device=win`, `?device=mobile` or `?device=tv`. TV mode supports arrow keys, Enter and Back or Esc.

---
thewiltedpetals.blooms
