<p align="center">
  <strong>Cullr — find the best of the ideas you already have.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-0969da.svg"></a>
  <img alt="Frontend: Angular" src="https://img.shields.io/badge/frontend-Angular-0969da.svg">
  <img alt="Backend: Next.js" src="https://img.shields.io/badge/backend-Next.js-0969da.svg">
  <a href="CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-0969da.svg"></a>
</p>

<p align="center">
  <a href="#about">About</a> ·
  <a href="#project-status">Project status</a> ·
  <a href="#repository-layout">Layout</a> ·
  <a href="#documentation">Documentation</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#license">License</a>
</p>

---

## About

Cullr is a personal idea-curation app. Its owner — a photographer, Christian
leader, product leader and programmer — generates around 100 ideas a day with
AI. Cullr is where those ideas get logged, critiqued, edited and curated, so
the very best ones get built. Ideas are mostly products for the Toronto and
GTA community (connecting people, helping businesses and people be found),
plus ideas from the owner's other areas of expertise.

The core value: surface the best idea of each day, then the best of each
week, month, and so on, up to a small set of the very best ideas curated for
the year.

### Principles

- **Single owner, not multi-tenant.** Cullr has exactly one user. There is no
  sign-up, invitations, team management or billing.
- **Capture, don't generate.** Idea generation happens elsewhere with AI.
  Cullr only logs, critiques, edits, archives and curates ideas the owner
  already has.
- **Curation is a ladder.** Day, then week, then month, then year-so-far —
  each level narrows to the best of the level below it.
- **Responsive and accessible.** Every screen works at phone width and meets
  WCAG 2.2 AA.
- **Generous whitespace.** The design favours space and clarity over density.

## Project status

Cullr's foundation is in place: the `@cullr/components` library, the Angular
application shell and a Next.js `GET /api/health` endpoint backed by SQLite.
Features are built one vertical slice at a time. See
[`AGENTS.md`](AGENTS.md) for the mandatory requirement-first, design-first,
mock-first, test-first workflow.

### Run and test

```sh
npm install
npm test                         # backend and frontend tests
npm run dev --workspace backend  # API on http://localhost:3000
npm start --workspace frontend   # app on http://localhost:4200, proxies /api
```

### Browse the mocks

No build step or server is required. Open
[`docs/mocks/index.html`](docs/mocks/index.html) in a browser.

## Repository layout

```
cullr/
├── frontend/         Angular workspace: cullr (app), components, api
├── backend/          Next.js backend (SQLite)
├── docs/             specs, detailed designs, mocks, design system
├── .claude/skills/   project skills (requirements, design, mocks, implementation)
├── .agents/skills/   the same skills, mirrored for other coding agents
└── AGENTS.md         working agreement for contributors and coding agents
```

## Documentation

- **Mocks:** [`docs/mocks/`](docs/mocks/) — open `docs/mocks/index.html` in a browser
- **Working agreement for contributors and coding agents:** [`AGENTS.md`](AGENTS.md)

## Contributing

Contributions are welcome. Cullr works requirement first: every change to
production behaviour starts with a requirement, a detailed design and a mock,
and is built in small slices with acceptance tests written first. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

- Report a bug or ask for a feature in [GitHub Issues](https://github.com/QuinntyneBrown/cullr/issues).
- Get help with the project: see [SUPPORT.md](SUPPORT.md).
- Report a security vulnerability privately: see [SECURITY.md](SECURITY.md).

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Cullr is released under the [MIT License](LICENSE).

All ideas, people and dates shown in the mocks are fictional placeholders used
to illustrate the product.
