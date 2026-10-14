# Cullr mocks

Static HTML mocks for every page, dialog and notification, in every state. Open [index.html](index.html) locally to browse them.

## Cast & catalog

Every mock reuses the same people, ideas and "today" so a reviewer can follow one story across screens.

- **Owner:** Jordan Reyes (initials **JR**), the single user of Cullr. Signs in with `jordan@cullr.app`.
- **Today:** Tue 14 Oct.
- **Active ideas (10):** Porch Light, Vestry, Golden Hour Match, Standup Ledger, Lint Before You Leap, Second Service, Framed in Transit, Curb to Counter, Roadmap Roulette, Quiet Ship — spanning Toronto & GTA, Photography, Faith & ministry, Product and Engineering.
- **Archived ideas (3):** Honk If You're Late, Tithe Tracker Lite, Sprint Bingo — each carries a short culling reason.
- **Curated best-of:** today = Porch Light, this week = Vestry, this month = Golden Hour Match, year so far = Standup Ledger.

## How to open the mocks

Open `index.html` directly from disk in a browser; no server or build step is needed. Every file supports:

- `?theme=dark` — force dark theme (the mock bar's theme toggle does the same).
- `?chrome=0` — hide the mock bar and notes so a page looks exactly like the shipped product.

## Open questions & assumptions

No `docs/specs/`, detailed designs or existing mocks existed yet, so the screen list and copy were derived from `AGENTS.md` plus the owner's clarifications. Assumptions made explicit here so they can be corrected before implementation:

- **Cullr is single-owner, not multi-tenant.** There is one user (the owner). Sign-up, invitations, team/member management, billing and legal/cookie-consent pages were deliberately excluded — see `not_applicable` reasons in `manifest.json`.
- **Idea generation is out of scope.** The owner generates ideas elsewhere with AI; Cullr only captures, critiques, edits, archives and curates ideas the owner already has. There is no "generate idea" screen — only a manual **Capture idea** dialog for logging an idea that already exists.
- **Curation periods are day / week / month / year-so-far**, matching the "best of each day, then week, month, up to a small set of the very best for the year" description in `AGENTS.md`. The exact rollup rules (e.g. how year-so-far is chosen from months) are left to detailed design.
- **Design tokens:** only the radius scale was adjusted for a softer, more generous feel; colour tokens were left as shipped because no contrast-checker was available to re-verify a new palette, and the shipped blue palette is pre-verified for WCAG AA in both themes.

## Re-check and re-screenshot

```sh
python ".agents/skills/writing-html-mocks/scripts/check_mocks.py" docs/mocks --write
python ".agents/skills/writing-html-mocks/scripts/screenshot_mocks.py" docs/mocks
```

`check_mocks.py --write` re-validates every mock and regenerates `index.html` and the coverage table below. `screenshot_mocks.py` renders every mock at 360×800, 768×1024 and 1280×800 in light and dark to `docs/mocks/.cache/mocks/` (never committed).

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | invalid | submitting | success | no-results | edge | long | selected | read-only | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | [✅](pages/sign-in/loading.html) | ➖ | [✅](pages/sign-in/error.html) | [✅](pages/sign-in/invalid.html) | [✅](pages/sign-in/submitting.html) |  |  |  |  |  |  |  |
| Forgot password (`forgot-password`) | [✅](pages/forgot-password/default.html) | ➖ | ➖ | [✅](pages/forgot-password/error.html) | [✅](pages/forgot-password/invalid.html) | [✅](pages/forgot-password/submitting.html) | [✅](pages/forgot-password/success.html) |  |  |  |  |  |  |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | ➖ | ➖ | [✅](pages/reset-password/error.html) | [✅](pages/reset-password/invalid.html) | [✅](pages/reset-password/submitting.html) | [✅](pages/reset-password/success.html) |  |  |  |  |  |  |
| Today (`today`) | [✅](pages/today/default.html) | [✅](pages/today/loading.html) | [✅](pages/today/empty.html) | [✅](pages/today/error.html) |  |  |  | [✅](pages/today/no-results.html) | [✅](pages/today/edge.html) |  |  |  |  |
| Ideas (`ideas`) | [✅](pages/ideas/default.html) | [✅](pages/ideas/loading.html) | [✅](pages/ideas/empty.html) | [✅](pages/ideas/error.html) |  |  |  | [✅](pages/ideas/no-results.html) | [✅](pages/ideas/edge.html) | [✅](pages/ideas/long.html) | [✅](pages/ideas/selected.html) |  |  |
| Idea detail (`idea-detail`) | [✅](pages/idea-detail/default.html) | [✅](pages/idea-detail/loading.html) | ➖ | [✅](pages/idea-detail/error.html) |  |  |  |  | [✅](pages/idea-detail/edge.html) |  |  | [✅](pages/idea-detail/read-only.html) |  |
| Curated (`curated`) | [✅](pages/curated/default.html) | [✅](pages/curated/loading.html) | [✅](pages/curated/empty.html) | [✅](pages/curated/error.html) |  |  |  | [✅](pages/curated/no-results.html) | [✅](pages/curated/edge.html) |  |  |  |  |
| Notifications (`notification-center`) | [✅](pages/notification-center/default.html) | [✅](pages/notification-center/loading.html) | [✅](pages/notification-center/empty.html) | [✅](pages/notification-center/error.html) |  |  |  |  |  |  |  |  |  |
| Settings (`settings`) | [✅](pages/settings/default.html) | [✅](pages/settings/loading.html) | ➖ | [✅](pages/settings/error.html) | [✅](pages/settings/invalid.html) | [✅](pages/settings/submitting.html) | [✅](pages/settings/success.html) |  |  |  |  |  |  |
| Account (`account`) | [✅](pages/account/default.html) | [✅](pages/account/loading.html) | ➖ | [✅](pages/account/error.html) | [✅](pages/account/invalid.html) | [✅](pages/account/submitting.html) | [✅](pages/account/success.html) |  |  |  |  |  |  |
| Archive (`archive`) | [✅](pages/archive/default.html) | [✅](pages/archive/loading.html) | [✅](pages/archive/empty.html) | [✅](pages/archive/error.html) |  |  |  | [✅](pages/archive/no-results.html) |  | [✅](pages/archive/long.html) |  |  |  |
| Help (`help`) | [✅](pages/help/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |
| Forbidden (`forbidden`) | [✅](pages/forbidden/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |
| Something went wrong (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |
| You're offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |

### Dialogs

| Screen | default | busy | invalid | failed | success | Requirements |
|---|---|---|---|---|---|---|
| Capture idea (`capture-idea`) | [✅](dialogs/capture-idea/default.html) | [✅](dialogs/capture-idea/busy.html) | [✅](dialogs/capture-idea/invalid.html) | [✅](dialogs/capture-idea/failed.html) | [✅](dialogs/capture-idea/success.html) |  |
| Edit idea (`edit-idea`) | [✅](dialogs/edit-idea/default.html) | [✅](dialogs/edit-idea/busy.html) | [✅](dialogs/edit-idea/invalid.html) | [✅](dialogs/edit-idea/failed.html) |  |  |
| Curate idea (`curate-idea`) | [✅](dialogs/curate-idea/default.html) | [✅](dialogs/curate-idea/busy.html) | ➖ | [✅](dialogs/curate-idea/failed.html) |  |  |
| Archive idea (`archive-idea`) | [✅](dialogs/archive-idea/default.html) | [✅](dialogs/archive-idea/busy.html) | ➖ | [✅](dialogs/archive-idea/failed.html) |  |  |
| Delete idea (`delete-idea`) | [✅](dialogs/delete-idea/default.html) | [✅](dialogs/delete-idea/busy.html) | [✅](dialogs/delete-idea/invalid.html) | [✅](dialogs/delete-idea/failed.html) |  |  |
| Restore idea (`restore-idea`) | [✅](dialogs/restore-idea/default.html) | [✅](dialogs/restore-idea/busy.html) | ➖ | [✅](dialogs/restore-idea/failed.html) |  |  |
| Export ideas (`export-ideas`) | [✅](dialogs/export-ideas/default.html) | [✅](dialogs/export-ideas/busy.html) | ➖ | [✅](dialogs/export-ideas/failed.html) | [✅](dialogs/export-ideas/success.html) |  |

### Notifications

| Screen | info | success | warning | danger | stacked | Requirements |
|---|---|---|---|---|---|---|
| Idea toast (`idea-toast`) | [✅](notifications/idea-toast/info.html) | [✅](notifications/idea-toast/success.html) | [✅](notifications/idea-toast/warning.html) | [✅](notifications/idea-toast/danger.html) | [✅](notifications/idea-toast/stacked.html) |  |
| Curation toast (`curation-toast`) | [✅](notifications/curation-toast/info.html) | [✅](notifications/curation-toast/success.html) | ➖ | ➖ |  |  |

<!-- coverage:end -->
