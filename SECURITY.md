# Security policy

Cullr holds its owner's own ideas, critiques and curation notes. We take
reports about its security seriously and thank everyone who reports a problem
responsibly.

## Supported versions

Cullr has not had a release yet. Security fixes are made on the `main` branch
only.

| Version | Supported |
|---|---|
| `main` | Yes |
| Anything else | No |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions or pull requests.**

Report them privately through GitHub's
[private vulnerability reporting](https://github.com/QuinntyneBrown/cullr/security/advisories/new)
("Report a vulnerability" on the repository's **Security** tab).

Include as much of the following as you can:

- The kind of issue (for example broken access control, exposure of private
  idea content, cross-site scripting, CSRF, injection)
- The affected endpoint, page or source file, with the branch or commit
- Step-by-step instructions to reproduce it, with any proof-of-concept code
- The impact: what an attacker could see or do

## What to expect

- We acknowledge your report within **5 business days**.
- We keep you informed while we investigate and fix it, and agree a disclosure
  date with you.
- We credit you in the advisory unless you ask us not to.

## Scope

In scope: the code in this repository and the behaviour it ships, especially
anything that bypasses authentication or authorization, since Cullr is a
single-owner app and no idea or curation data should ever be reachable
without the owner's own sign-in.

Out of scope: any data shown in the mocks under `docs/mocks/`, which is
fictional and exists only to illustrate the product; denial-of-service
through volume; and reports from automated scanners without a demonstrated
impact.

## Safe harbour

We will not pursue legal action against anyone who researches and reports a
vulnerability in good faith under this policy: test only against your own
local copy or accounts you own, do not access or change other people's data,
and give us reasonable time to fix the issue before disclosing it.
