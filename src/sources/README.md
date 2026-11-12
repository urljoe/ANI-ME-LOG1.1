# Source adapter contract

This document records the first shared adapter interface and the first provider path. The web app remains a static GitHub Pages app; provider integrations must work in the browser and keep the source identity attached to every imported record.

## Adapter contract

Every adapter is registered with a unique `id`.

- `matches(source)` identifies configured sources handled by the adapter.
- `capabilities` lists only confirmed behavior. It is descriptive; it must not imply direct video or embedding support.
- `load(source)` returns an array of normalized title records. The existing app parser supplies records with fields such as `title`, `raw`, `aliases`, `image`, `link`, `video`, `ep`, `date`, `desc`, `tags`, `total`, and `score`.
- `resolve(record)`, when provided, returns a safe playback target shaped as `{ type, src, fallbackUrl, attribution }`, or `null` when no usable target exists.
- The engine retains `adapterId` and source name on each provenance record. The app uses the resolved source URL, displays its source label, and offers the original page when an embedded page cannot play.

Adapters must not scrape undocumented private endpoints, bypass access controls, or label a site link as a direct stream. Keep feed loading behind the existing timeout/proxy handling in `index.html`.

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

## Other provider status

AniKoto, AnimePahe, ReAnime, DonghuaZone, DonghuaNation, AnimeKhor, and DonghuaStream remain individually configurable website shortcuts. No provider-specific adapter is enabled for those names. Third-party scraper projects are evidence that code exists, not evidence that the provider supports or authorizes an integration.

## Review checklist for each next provider

1. Locate a provider-owned public API/feed or obtain a supported integration agreement.
2. Record whether it supplies discovery, metadata, episode numbering, direct media, or provider-controlled embeds.
3. Map its response into the normalized record shape and retain the original title, URL, and provider label.
4. Confirm playback type before sending it to the player; keep the original provider page as fallback.
5. Keep failures isolated to that adapter and report rate limits, CORS, and unavailable feeds accurately.
6. Verify source import, duplicate merge/provenance, original-brand display, and playback/fallback in the deployed app before calling the provider integration complete.
