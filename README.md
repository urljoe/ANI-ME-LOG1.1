# Ani-Me Log

Ani-Me Log is a browser-first anime library and player UI with a Capacitor wrapper for Android.

## Included in this build
- Existing title library, watchlist, episode progress, download storage, schedule and source settings.
- Boxed 16:9 player with native video, HLS.js playback, supported iframe embeds, episode navigation and provider failover for direct video files.
- Seven configurable external provider shortcuts: AniKoto, AnimePahe, ReAnime, DonghuaZone, DonghuaNation, AnimeKhor and DonghuaStream.
- Provider addresses are saved locally in the current browser/app profile. The same app code works on the website and in the Capacitor APK.
- “Open in player” attempts to display a provider website inside the boxed player. Some sites block iframe/WebView embedding; “Open site” is the fallback.

## Important integration boundary
The seven providers are configured as website shortcuts only. They are not advertised as automatic catalogue feeds or direct-stream extractors because their public API/feed availability and embedding permissions have not been established. The app does not bypass DRM, login requirements, paywalls, or site access controls. To add real title/episode sync, use a provider-supported public API/feed or an authorized integration endpoint.

## Website and APK
Deploy the web app as usual. The Android app wraps the same `index.html` using Capacitor. Provider addresses and watch progress are stored locally on each installation/browser profile; they do not automatically sync between devices without a backend account/sync service.

## Android
- `npm install`
- `npx cap add android` (first Android project setup)
- `npm run sync`
- `npx cap open android`

## Source engine and project layout

The source engine is being introduced incrementally so the GitHub Pages app and Capacitor wrapper keep using the same entry point.

- `index.html` remains the current application entry point.
- `src/sources/engine.js` provides the shared provider registry, adapter selection, HTTP(S) provider URL validation, and playback resolution boundary.
- `sources.json` contains the configured AnimeSchedule RSS feeds.

The configured feed adapter continues to use the existing JSON/RSS parsing. Duplicate detection and merging now run through the shared engine, retaining source records and episode links. Provider shortcuts are registered centrally and remain available individually in Settings. They do not claim catalogue discovery, episode extraction, or direct-video support until a provider-supported integration is verified.
