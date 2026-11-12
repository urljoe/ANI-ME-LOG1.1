# Ani-Me Log

Ani-Me Log is a browser-first anime library and player UI with a Capacitor wrapper for Android.

## Included in this build
- Existing title library, watchlist, episode progress, download storage, schedule and source settings.
- Boxed 16:9 player with native video, HLS.js playback, supported iframe embeds, episode navigation and provider failover for direct video files.
- Central source engine with individual Settings entries for 15 providers, including catalog Quick Add for AniKoto, AnimePahe, AniWorld, KickAssAnime, Anime4Up, Anime-Sama, Latanime, Mugiwara, JustAnime and AnimeAV1.
- AnimeSchedule Sub, Dub and Raw RSS feeds use a named adapter; AniList, Jikan, Kitsu, Internet Archive, RSS/JSON, website-feed discovery, generic JSON/API and imported data are routed through format-aware adapters.
- Catalog records retain provider labels and original title-page links when duplicate titles are merged.
- Provider addresses are saved locally in the current browser/app profile. The same app code works on the website and in the Capacitor APK.
- “Open in player” attempts to display a provider website inside the boxed player. Some sites block iframe/WebView embedding; “Open site” is the fallback.

## Important integration boundary
The ten added catalog providers currently import public catalog cards or public catalog data where a provider handler exists. These are experimental and still need live beta checks for domain availability, page structure, CORS/proxy behavior, and useful results. They do not extract direct video streams. All 15 providers remain individually accessible in Settings; streaming-provider entries without a verified supported integration remain website shortcuts. The app does not bypass DRM, login requirements, paywalls, or site access controls. Use a provider-supported public API/feed or authorized integration endpoint for future playback adapters.

## Website and APK
Deploy the web app as usual. The Android app wraps the same `index.html` using Capacitor. Provider addresses and watch progress are stored locally on each installation/browser profile; they do not automatically sync between devices without a backend account/sync service.

## Android
- `npm install`
- `npx cap add android` (first Android project setup)
- `npm run sync`
- `npx cap open android`

## Source engine and project layout

The source engine is organized as browser-compatible modules while the GitHub Pages app and Capacitor wrapper continue to use the same entry point.

- `index.html` remains the current application entry point.
- `src/sources/engine.js` provides source-format inference, the shared provider registry, adapter selection, duplicate merge provenance, HTTP(S) provider URL validation, and playback resolution boundary.
- `sources.json` contains the configured AnimeSchedule RSS feeds.

AnimeSchedule Sub, Dub, and Raw feeds use a named RSS adapter and retain each feed's source label and original item link. They are schedule/title entries, not direct video streams; playback falls back to the original provider page when an entry has no direct media URL. Catalog adapter capabilities and beta checks are documented in [`src/sources/README.md`](src/sources/README.md).

## Source adapter checks
With Node.js 18 or newer installed, run `npm test` to execute the offline adapter checks. They use sample feed records and make no network requests; live RSS availability must be checked separately in the app.

