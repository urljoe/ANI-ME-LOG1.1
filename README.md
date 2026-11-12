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

## Web app version updates
The web app checks `version.json` and shows an in-app notice when the published version is newer than the version installed in the current page. The user can apply it immediately or dismiss it until later. “Sync sources” refreshes title feeds; it does not update the app itself.

For each web release, update the version in `version.json`, the `app-version` meta tag in `index.html`, and `package.json`; give the service worker cache a new name in `sw.js`. The service worker waits until the user selects “Update now” before activating a waiting app shell.

This notice is for the GitHub Pages web app and its installable PWA. A packaged Android APK does not get replaced by reloading its bundled webpage; Android update delivery needs a separate release/distribution path.
