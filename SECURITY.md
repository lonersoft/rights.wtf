# Security Policy

rights.wtf is a pre-rendered static site on Cloudflare Workers. There are no accounts, no
cookies, no database, and no user input at runtime — so the interesting risks are not the usual ones.
Two of them matter more than a typical XSS: **the people who read this site are the ones at risk**,
and **a corrupted page here is a real-world harm, not a defaced banner**.

---

## Reporting a vulnerability

Email **rights@lumis.moe**. Include what you found, how you found it, and what you think it gets you.
PoC against a local build, please — not against rights.wtf.

Prefer GitHub? Open a private report via **Security → Report a vulnerability**
(https://github.com/lonersoft/rights.wtf/security/advisories/new). If that form is missing,
our org has not enabled private vulnerability reporting yet — use email and remind us.

We aim to acknowledge within a week. We are two students and this is a side project: we will not
pay bounties, and we will not go to law against good-faith research. Fix first, thank you in the
changelog after.

**Do not** open a public issue for anything exploitable, and do not post it to the project Discord.

## What counts as a security issue here

- Anything that lets someone change published legal content without review — the build pipeline,
  GitHub Actions, the Cloudflare account, the `rights.wtf` domain or its DNS, or TLS.
- Secrets: the Discord webhook URL (anyone holding it can post as us), the Free Mobile SMS
  credentials (anyone holding them can text our phones), Cloudflare API tokens.
- Supply chain: a compromised or typosquatted dependency in `pnpm-lock.yaml` that reaches the deploy.
- Ways to make our notification bots deliver an attacker-controlled message to our own Discord or
  to maintainers' phones (see known risks below).
- Anything that degrades reader privacy on a surveilled connection: injected third-party script,
  analytics, a leaking referrer, or cacheable pages that reveal a visit.
- Content integrity attacks that don't look like a hack: a plausible-sounding but false statute
  citation added to a country page via PR, or a helpline number quietly changed to a different one.

## Please don't report

- "Your legal info is wrong" — that is the
  [correction form](https://github.com/lonersoft/rights.wtf/issues/new?template=incorrect_info.yml).
  Wrong law is the bug this project exists to have fewer of.
- Missing hardening that costs us something real (we deliberately ship no CSP nonce complexity on
  a page with one self-hosted script), scanner output, or "no bug bounty".
- Reports about the *reader's* own threat model that we cannot fix, like "my ISP can see that I
  visited rights.wtf" — true, and see below.

---

## Reader-facing threat model

Someone in a country where being queer is criminalised may open this site while their network,
device, or household is not safe. Current facts, stated plainly:

- Pages are static HTML. The only script we ship is Astro's link prefetcher, served from our own
  origin (`/_astro/*`). No third-party JS, no fonts from elsewhere, no analytics, no cookies,
  no local storage.
- Nothing requires an account, a name, or an email address to read.
- **HTTPS protects content, not the fact of the visit.** Your ISP, the network you're on, and
  anyone watching DNS or SNI can see you reached `rights.wtf`. Cloudflare sees IPs to serve the
  request. The domain name is itself a hint at what the page is about.
- Browser history, screenshots, and any "recently visited" OS list will expose the visit.
- We are on a `.wtf` TLD for the joke; if that ever reads as unserious to you, the site is also
  reachable as `https://rights.wtf` over plain HTTPS with no redirect through anything else.

If reading this site is dangerous where you are: don't use a browser you care about. Use Tails or
Tor, or read the repository over HTTPS from an account that isn't yours. We'll keep the pages plain
HTML so they work under a restrictive proxy and on an old phone.

**Not yet done** (honest list, contributions welcome): no `Content-Security-Policy`, no
`Referrer-Policy: no-referrer`, no `X-Content-Type-Options`, and our `_headers` file currently
contains only `Cache-Control` for `/_astro/*`. Adding those headers is small and worth doing.

## Known risks in our own automation

Tracked here so we don't pretend we didn't know:

1. **`activity-notify.yml` puts untrusted issue/PR text into Discord and SMS.** Title, body excerpt
   and author avatar are rendered in the project Discord. Discord markdown means a crafted issue
   body can show a misleading link label pointing at a phishing URL, in a channel our contributors
   trust. It also writes attacker-chosen text into maintainers' SMS messages.
   *Wanted fix:* strip or escape markdown, and send a fixed summary rather than raw body text.
2. **`issue-triage.yml` creates labels from user-supplied text** (`country: <up to 40 chars>`).
   Sanitized to `[a-zA-Z0-9\s\-_()]`, so no injection into the script — but a spammer can mint an
   unbounded number of labels and clutter the repo.
   *Wanted fix:* map to a known country list instead of free text; skip unknown values.
3. **Notifications silently skip fork PRs.** GitHub does not expose repository secrets to
   `pull_request` events from forks, so PRs from outside collaborators produce no Discord/SMS ping.
   Not a hole, but a false sense of coverage: we may not notice a PR at all.
4. **`welcome.yml` interpolates the author login into a posted comment.** GitHub escapes
   markdown there, and logins can't contain markup, so this is low risk — noting it because it is
   the same pattern as #1.

## Scope

| In scope | Out of scope |
| --- | --- |
| `src/`, `astro.config.mjs`, `wrangler.json`, `.github/workflows/` | `lumis.moe`, `loners.software` |
| Cloudflare Workers configuration and DNS for `rights.wtf` | Cloudflare's own platform |
| Dependencies in `pnpm-lock.yaml` | Sites we link to (helplines, gazettes, NGOs) |
| The correction/labeling data pipeline | Physical safety of a reader in a hostile country, beyond publishing accurate information |
