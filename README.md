# Ani-Me Log — Universal Web Wrapper

A no-build-step anime library and player, packaged as an installable PWA and prepared for native Android/iOS wrapping with Capacitor.

## Included

- Original Ani-Me Log catalogue, sources, watchlist, history, episode progress and settings from `files8.1.zip`.
- Existing Ani-Me Log icon artwork, restored from the earlier project archive.
- PWA manifest, standalone/fullscreen display hints and service worker app-shell caching.
- Browser history/back handling suitable for wrapped Android back navigation.
- Native HTML5 video playback for direct MP4/WebM/OGG streams and HLS playback where supported (HLS.js is loaded when required).
- Embedded providers remain embedded when they do not expose a direct media URL. Provider branding/watermarks inside their own player are not removed. The app does not add badges or overlays on top of the video.
- Watchlist and progress continue to persist using the existing local storage implementation.

## Run as a website / install as PWA

Serve this folder over HTTPS (or localhost for development). Open the site in a supported browser and choose **Install app** / **Add to Home Screen**. Service workers and PWA installation do not work reliably from `file://` or plain HTTP on a public host.

## Build a native Android or iOS wrapper

Install Node.js (LTS), then from this folder:

```sh
npm install
npx cap add android
npx cap add ios
npx cap sync
npm run android
# or: npm run ios
```

Open the generated native project in Android Studio or Xcode and build/sign it there. iOS builds require macOS and Xcode. Native platform folders are generated locally by Capacitor and are not included in this source ZIP.

## Offline limitations

The app shell, icon, manifest and source-list configuration are cached for offline startup. Previously saved watchlist/history/progress remain in browser storage. Live catalogues, remote artwork, external feeds, and third-party video streams still require connectivity unless their provider independently supports offline playback. This wrapper does not download or bypass protected streams.

## Playback notes

Direct media URLs ending in `.mp4`, `.webm`, `.ogg` or `.m3u8` use the app's plain video surface and standard browser controls. YouTube, Dailymotion, Archive.org, Rumble and ordinary web pages continue to use their provider/page embed paths as appropriate. A site that blocks embedding or direct access must be opened at its original source.

## Changelog

- Catalogue merger: titles from different providers are grouped by canonical and alternate names (English, romaji, synonyms), and every provider record is kept.
- Title pages list each provider link with its episode number. Direct media URLs (when a provider supplies one) play in the native player; other links use the embed or open-on-site path.
- Alternate playback chips use the direct media URL when one exists.

## Changelog

- Catalogue merger: titles from different providers are grouped by canonical and alternate names (English, romaji, synonyms), and every provider record is kept.
- Title pages list each provider link with its episode number. Direct media URLs (when a provider supplies one) play in the native player; other links use the embed or open-on-site path.
- Alternate playback chips use the direct media URL when one exists.
- Episode numbers are normalised, so "01", "1" and "1.0" are treated as the same episode.
- Every episode number in the grid is playable. Episodes with a direct link play that link. Episodes no provider lists open the title's source site inside the player, with a note saying so.
