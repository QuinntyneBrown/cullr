# Screen composition

Binding map from every mock screen to the components that build it. Before
implementing any page, dialog, notification or shell part, read its entry
below and use exactly the components it lists. Build locally only the UI
marked **Local**.

- **Sources:** `docs/mocks/` (every page/dialog/notification, every state)
  and   `docs/design-system/components/*.html` — no `docs/icd` exists yet and
    `@cullr/components` (`frontend/projects/components`) currently ships only
    `skip-link`, `empty-state`, `sidebar-navigation`, `ToastService` and
    `DialogService`, so the **design system is the
  component catalogue**. A component is named by its design-system page slug
  (e.g. `button`, `empty-state`); the CSS class comes from that page's `Code`
  section and lives in `docs/design-system/assets/components.css`.
- **Local UI** means no design-system component page documents the markup —
  it must be hand-built in the app. Where a class exists in
  `components.css` but no component page shows it, it is called out as a
  **catalogue gap** instead of invented as a component.
- Mock-only chrome (`mock-bar`, `mock-note`, the `?chrome=0`/`?theme=` query
  handling) is excluded throughout; it never ships.
- Typography/colour utility classes used inline (`text-caption`, `text-muted`,
  `text-subtle`, `text-label`, `overline`) are Foundations (Typography/Color),
  not components; they are not listed per screen.

## Catalogue gaps (fix before/while building the matching screen)

| Class(es) | Used on | Documented component | Gap |
|---|---|---|---|
| `.toast__action`, `.toast__progress`, `.toast__text` | Idea toast, Curation toast | `toast` | Undo action, auto-dismiss progress bar and body text node aren't in the component's anatomy/Code. |
| `.topbar__menu`, `.topbar__nav` | every dashboard page's top bar | `top-bar` | Mobile nav-toggle button and nav slot aren't documented. |
| `.sidebar__group` | sidebar's "Account" divider | `sidebar-navigation` | Group label isn't documented. |
| `.cluster--end` | several pages | `layout-primitives` | Modifier isn't documented (`.cluster--between` and `.container--narrow` now are). |

## Shell

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `skip-link` | — |
| Dashboard top bar (search, notifications, account) | `top-bar`, `text-field` (`.search`), `button`, `badge` (`.badge--count`), `tooltip`, `avatar` | — |
| Primary sidebar navigation | `sidebar-navigation` | — |
| Dashboard page shell (sidebar + content column) | — | **Page shell** (`.sidebar-layout`): CSS grid wrapper placing the sidebar beside the top bar/content/footer column. |
| Page header (title, subtitle, actions) | — | **Page header** (`.page-header` + `.subtitle`): heading row with optional action buttons, present on every dashboard page. |
| Footer | — | **Footer** (`.footer`): "Cullr · personal idea curation" + Help link, present on every dashboard and account page. |
| Auth shell (sign-in, forgot/reset password) | `card` | **Auth shell** (`.auth-layout` + `.auth-card`): centred single-card layout with only a brand bar above it. |
| Bare top bar (auth pages, 404/403/500/offline) | `top-bar` (brand only, no actions) | — |

## Shared local components

| Item | Used by | Notes |
|---|---|---|
| Page shell (`.sidebar-layout`, `.page-header`, `.footer`) | Today, Ideas, Idea detail, Curated, Notifications, Settings, Account, Archive, Help | Build once as the authenticated-area layout; every dashboard page composes it with `top-bar` + `sidebar-navigation`. |
| Auth shell (`.auth-layout`, `.auth-card`) | Sign in, Forgot password, Reset password | Build once as the unauthenticated layout wrapping a `card`. |
| Idea-card header/footer (score stat + action buttons) | Today (all states) | Composition of `card` + `badge` + the undocumented `.card__header`/`.stat__value` (see catalogue gaps) + `button`. |
| Full-page error/offline wrapper (bare top bar + centred `empty-state`) | Page not found, Forbidden, Something went wrong, You're offline | Shares one local "standalone error page" shell; only icon/title/copy/actions change. |

## Pages

### Sign in (`/sign-in`, mock folder `pages/sign-in`: default, loading, empty n/a, error, invalid, submitting)
- **Library:** `card`, `form-field` (via `field`), `text-field`, `button` (`btn--primary`, `btn--block`, `btn--link`), `alert` (error/invalid).
- **Local:** Auth shell.
- Loading swaps the form for `skeleton`.

### Forgot password (`/forgot-password`) and Reset password (`/reset-password`)
*(mock folders `pages/forgot-password`, `pages/reset-password`: default, error, invalid, submitting, success; empty/loading n/a)*
- **Library:** `card`, `form-field`, `text-field`, `button`, `alert` (error/invalid), `dialog` (`.dialog__icon--info`, reused standalone for the success checkmark).
- **Local:** Auth shell.
- Identical composition for both screens; only copy and field count differ.

### Today (`/`, mock folder `pages/today`: default, loading, empty, error, no-results, edge)
- **Library:** `chip` (category filters), `card` (`card--interactive`), `badge`, `button`, `empty-state` (empty/no-results), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell; idea-card header/footer + score stat (see Shared local components); content-section grouping (`.section`) wrapping the idea-card list.

### Ideas (`/ideas`, mock folder `pages/ideas`: default, loading, empty, error, no-results, long, edge, selected)
- **Library:** `tabs` (status filter), `chip`, `select` (sort), `table` (with `num`/`row-actions` gaps), `pagination`, `button`, `badge`, `empty-state` (empty/no-results), `error-page` (error), `skeleton` (loading), `checkbox` (native row-selection input in `selected`).
- **Local:** Page shell.

### Idea detail (`/ideas/:id`, mock folder `pages/idea-detail`: default, loading, error, edge, read-only; empty n/a)
- **Library:** `breadcrumb`, `badge`, `button`, `card` (summary + status-history panels), `description-list` (critique notes), `list` (status history), `error-page` (error), `skeleton` (loading), `alert` (`alert--warning`, read-only banner).
- **Local:** Page shell.

### Curated (`/curated`, mock folder `pages/curated`: default, loading, empty, error, no-results, edge)
- **Library:** `chip`, `card` (`card__title`, overline label), `badge`, `empty-state` (empty/no-results), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell.

### Notifications (`/notifications`, mock folder `pages/notification-center`: default, loading, empty, error)
- **Library:** `list`, `badge` (`badge--count`), `button` ("Mark all read"), `empty-state` (empty), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell; the coloured status icon chip in each row (an inline composition of `toast--*` colour + an icon, not a documented component).

### Settings (`/settings`, mock folder `pages/settings`: default, loading, error, invalid, submitting, success; empty n/a)
- **Library:** `form-field`, `text-field` (time/number inputs), `switch`, `button`, `card` (`.well`, export panel), `alert` (invalid), `inline-message` (success), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell.

### Account (`/account`, mock folder `pages/account`: default, loading, error, invalid, submitting, success; empty n/a)
- **Library:** `avatar` (`avatar--lg` profile), `form-field`, `text-field`, `textarea`, `button`, `alert` (invalid), `inline-message` (success), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell.

### Archive (`/archive`, mock folder `pages/archive`: default, loading, empty, error, no-results, long)
- **Library:** `chip`, `table`, `pagination`, `button`, `badge`, `empty-state` (empty/no-results), `error-page` (error), `skeleton` (loading).
- **Local:** Page shell.

### Help (`/help`, mock folder `pages/help`: default only; loading/empty/error n/a)
- **Library:** `card`, `description-list` (keyboard shortcuts).
- **Local:** Page shell.

### Full-page errors — Page not found (`/404`), Forbidden (`/403`), Something went wrong (`/500`), You're offline (`/offline`)
*(mock folders `pages/not-found`, `pages/forbidden`, `pages/server-error`, `pages/offline`: default only — no other states apply)*
- **Library:** `top-bar` (brand only), `layout-primitives` (`container--narrow`), `empty-state`, `button`.
- **Local:** Full-page error/offline wrapper (see Shared local components). Grouped as one entry: all four are the same shell with different icon/title/copy.

## Dialogs

| Dialog (mock folder: states) | Overlay surface | Library components | Local UI |
|---|---|---|---|
| Capture idea (`capture-idea`: default, invalid, busy, failed, success) | `dialog` | `form-field`, `text-field`, `textarea`, `select`, `button`, `alert` (failed) | — |
| Edit idea (`edit-idea`: default, invalid, busy, failed) | `dialog` | `form-field`, `text-field`, `textarea`, `select`, `button`, `alert` (failed) | — |
| Curate idea (`curate-idea`: default, busy, failed; invalid n/a) | `dialog` | `radio-group` (`.choice`/`.choice__text`), `button`, `alert` (failed) | — |
| Archive idea (`archive-idea`: default, busy, failed; invalid n/a) | `dialog` | `form-field`, `textarea` (optional reason), `button`, `alert` (failed) | — |
| Delete idea (`delete-idea`: default, invalid, busy, failed) | `dialog` | `form-field`, `text-field` (type-to-confirm), `button`, `alert` (failed) | — |
| Restore idea (`restore-idea`: default, busy, failed; invalid n/a) | `dialog` | `button`, `alert` (failed) | — |
| Export ideas (`export-ideas`: default, busy, success, failed; invalid n/a) | `dialog` | `checkbox` (`.choice`/`.choice__text`), `button`, `alert` (failed) | — |

All seven share one surface: `backdrop` + `dialog__panel` with `dialog__header`/`dialog__icon`/`dialog__title`, `dialog__body`, `dialog__footer` — build the `dialog` component once and compose each dialog's body from it.

## Notifications

| Notification (mock folder: states) | Overlay surface | Library components | Local UI |
|---|---|---|---|
| Idea toast (`idea-toast`: info, success, warning, danger, stacked) | `toast-region` | `toast` (all four status variants, `close`) | — (see `toast__action`/`toast__progress`/`toast__text` catalogue gaps) |
| Curation toast (`curation-toast`: info, success; warning/danger n/a) | `toast-region` | `toast` (info, success only) | — (same gaps) |

## Summary of local UI to build

1. **Page shell** — `.sidebar-layout` + `.page-header` + `.footer`, composing `top-bar` and `sidebar-navigation`; used by all 9 authenticated dashboard pages.
2. **Auth shell** — `.auth-layout` + `.auth-card` wrapping `card`; used by Sign in, Forgot password, Reset password.
3. **Full-page error/offline wrapper** — bare `top-bar` + centred `empty-state`; used by Page not found, Forbidden, Something went wrong, You're offline.
4. **Idea-card header/footer + score stat** (`.card__header`, `.stat__value`) — used by Today's idea list.
5. **Notification type icon chip** — coloured status icon circle in the Notification Center list.
