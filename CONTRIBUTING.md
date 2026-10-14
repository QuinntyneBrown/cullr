# Contributing to Cullr

Thank you for your interest in Cullr. This guide explains how to propose a
change and what a pull request needs before it can be merged.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Before you start](#before-you-start)
- [How we build: requirement first, test first](#how-we-build-requirement-first-test-first)
- [Coding conventions](#coding-conventions)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Security issues](#security-issues)
- [License](#license)

## Ways to contribute

- Report a bug or suggest an improvement in
  [GitHub Issues](https://github.com/QuinntyneBrown/cullr/issues).
- Improve requirements, designs, mocks or documentation.
- Review open pull requests.

## Before you start

- **Read [`AGENTS.md`](AGENTS.md).** It is the working agreement for everyone
  who changes this repository, people and coding agents alike: the domain
  rules, architecture and conventions live there.
- **Open or find an issue first** for anything larger than a typo, so the
  approach can be agreed before you invest time in it.
- Cullr is a **single-owner** app. There is one user, the owner. Do not
  propose sign-up, invitations, team/member management, billing or
  multi-tenant features.

## How we build: requirement first, test first

Every change to production behaviour, including a change to how an existing
page behaves, follows the same path:

1. **Requirement.** Add or update the L1/L2 requirement in
   `docs/specs/`, with acceptance criteria. UI components also get a
   component requirements document.
2. **Detailed design** in `docs/detailed-designs/`.
3. **Mock** in [`docs/mocks/`](docs/mocks/) for every page, dialog and
   notification the change touches, in every state.
4. **Implement incrementally with acceptance tests first (ATDD).** Plan small,
   reviewable slices. For each slice: write Given-When-Then criteria, write the
   acceptance test, run it and see it fail for the expected reason, then write
   only the code that makes it pass. Refactor with the tests green and run the
   regression checks before the next slice.

Documentation-only, design-system-only, mock-only and test-only changes do not
need this path. Mocks and the design system are design artifacts and do not
get tests. Never add an architecture test (one that asserts the shape of the
codebase instead of its behaviour).

The project skills in `.claude/skills/` describe each step in detail
(`engineering-requirements`, `writing-software-design-documents`,
`writing-html-mocks`, `implementing-incrementally` and others). They are
mirrored in `.agents/skills/`; keep the two copies identical.

## Coding conventions

The full set of domain rules, architecture and conventions is in
[`AGENTS.md`](AGENTS.md), including the highest-priority rule in this
repository: **scope lock**. Implement exactly what was asked for, nothing
more — no invented features, no future-proofing, no unsolicited refactoring.
When a task seems to need more than that, stop and ask before writing code.

## Commit messages

Write a short summary line in the imperative mood that says what changes for
Cullr's owner, for example:

```
Show the week's best idea on the Today page
```

Add a body when the reason is not obvious from the summary. Reference the
issue or requirement it addresses (for example `Fixes #12` or `L2-065`).

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change following the path above, keeping each pull request to one
   reviewable change.
3. Run the tests and checks for every part of the stack you touched.
4. Update documentation, including `AGENTS.md` if you change the repository
   layout or an architectural rule.
5. Open the pull request and fill in the template: what changes and why, and
   how you tested it. Include screenshots at phone width for visible changes.

A pull request is ready to merge when CI is green, review comments are
resolved and a maintainer has approved it. Maintainers may ask for changes or
close pull requests that do not fit the project's direction; opening an issue
first avoids that.

## Reporting bugs and requesting features

Search [existing issues](https://github.com/QuinntyneBrown/cullr/issues)
first, then open a new one with:

- **Bug report:** what happened, what you expected, and steps to reproduce.
- **Feature request:** the problem it solves before the solution.

## Security issues

Do not report security vulnerabilities in public issues. Follow
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE) that covers this project.
