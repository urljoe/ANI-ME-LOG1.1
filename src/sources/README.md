# Source adapter contract

This document records the first shared adapter interface and the first provider path. The web app remains a static GitHub Pages app; provider integrations must work in the browser and keep the source identity attached to every imported record.

## Adapter contract

Every adapter is registered with a unique `id`.

- `matches(source)` identifies configured sources handled by the adapter.
- `capabilities` lists only confirmed behavior. It is descriptive; it must not imply direct video or embedding support.
- `load(source)` returns an array of normalized title records. The existing app parser supplies records with fields such as `title`, `raw`, `aliases`, `image`, `link`, `video`, `ep`, `date`, `desc`, `tags`, `total`, and `score`.
- `resolve(record)`, when provided, returns a safe playback target shaped as `{ type, src, fallbackUrl, attribution }`, or `null` when no usable target exists.
- The engine retains `adapterId` and source name on each provenance record. The app uses the resolved source URL, displays its source label, and offers the original page when an embedded page cannot play.

Adapters must not access private endpoints, bypass access controls, or label a site page as a direct stream. Keep feed loading behind the existing timeout/proxy handling in `index.html`.

## First provider path: AnimeSchedule RSS

| Capability | Confirmed for this adapter |
| --- | --- |
| Input | AnimeSchedule Sub, Dub, and Raw RSS feed URLs in root `sources.json` |
| Title/schedule entries | Yes; parsed through the app's existing RSS parser |
| Episode number and original item link | When the feed entry contains them |
| Source label | Preserved from the configured source name, such as “AnimeSchedule · Sub” |
| Direct video URL | No |
| Playback fallback | Open/embed the original feed item page; if embedding is refused, use “Open source” |
| Credentials | Public RSS feeds need no app token. The official v3 API is a separate option that requires an AnimeSchedule account and application token; do not place a private token in this public repository. |

AnimeSchedule describes its data as schedule/release information and offers an RSS feed. This adapter is therefore a schedule/title source, not a streaming extractor.

## Provider catalog integrations

Quick Add now includes catalog sources for AniKoto, AnimePahe, AniWorld, KickAssAnime, Anime4Up, Anime-Sama, Latanime, Mugiwara, JustAnime, and AnimeAV1.

These integrations are catalog-only. They read public catalog pages or the source app’s public catalog data, then return normalized title cards with the original provider page and attribution. AnimePahe entries can include an episode number when its public posts feed supplies one. The integrations do not resolve or extract media URLs; the player opens the original provider page.

The default domains come from the user-provided Anime Vault installer and may be stale. Each Quick Add item can use the matching address saved in Settings instead. Catalog pages can change, block browser requests, or require the app’s existing proxy handling. Each source loads a limited catalog page, not a full multi-page crawl.

AniKoto, AnimePahe, ReAnime, DonghuaZone, DonghuaNation, AnimeKhor, and DonghuaStream also remain individually configurable website shortcuts. The eight newly added provider names have shortcut fields as well as catalog Quick Add entries.

## Review checklist for each next provider

1. Confirm its public catalog page or public catalog endpoint and current hostname.
2. Record whether it provides title cards, artwork, episode numbers, episode pages, direct media, or provider-controlled embeds.
3. Map only the available catalog fields into normalized records; retain the original title, page URL, and provider label.
4. Keep the provider page as the playback target unless a supported direct-media integration is documented.
5. Keep failures isolated to that adapter and report CORS, rate limits, domain changes, and unavailable feeds accurately.
6. Verify title import, duplicate merge/provenance, original-brand display, and provider-page fallback in the deployed app before calling an integration complete.

