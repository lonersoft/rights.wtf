# Contributing to rights.wtf

Thanks for being here. Two of us build this site between classes, so contributions are
genuinely how this project stays correct and useful.

There are two kinds of contribution and they are equally welcome:

1. **Fixing or adding information** — a law that changed, a helpline that works, a country nobody has written yet.
2. **Fixing or adding code** — the site itself, the build, the tooling.

You do not need to know how to code to do the first one, and it is the one that matters most.

---

## The one hard rule: every claim needs a receipt

rights.wtf tells people what the law says about them. If that is wrong, someone makes a real
life decision on bad information — moving, coming out, starting HRT, applying for asylum.
So we do not merge unsourced legal claims, ever, no matter how confident the writer sounds.

**Source hierarchy** (use the highest one you can get):

1. Primary law — the statute, code article, or decree, in the official gazette or legislature site.
2. Court rulings — constitutional or supreme court decisions that change how a law applies.
3. Official government guidance — ministry or registry pages on name/marker changes, visas, etc.
4. Accredited monitors — ILGA World / ILGA-Europe, TGEU, Human Rights Watch, Amnesty, UN treaty bodies.
5. Local LGBTQ+ organisations and legal aid groups — best source for *enforcement reality*, which
   is not the same as what is on the books.

What does **not** count: reddit, wikipedia, a news article about a law that is not yet in force,
a tweet, an advocacy poster without a citation, or "my cousin lives there and says".
A news article is fine as a pointer to the law it describes — link the law.

If a fact is contested, disputed in court, or recently changed and unclear, say so **on the page**.
"Parliament passed X in 2024 but the implementing decree has not been published as of 2026-10" is a
useful sentence. A confident wrong one is not.

---

## Contributing information

There are two ways to contribute legal information:

### 1. The web contribution form (recommended)

Go to **[rights.wtf/contribute](https://rights.wtf/contribute)** and select the jurisdiction.
The form validates your claims against the real schema live in the browser, previews the exact
JSON, and opens a pull request for human review. No git, no hand-editing JSON braces, and no
GitHub account required.

### 2. Issue template or manual PR

If you prefer plain text or have a broad question, open
[an issue with the correction form](https://github.com/lonersoft/rights.wtf/issues/new?template=incorrect_info.yml).
We verify and write the change ourselves.

If you are editing the JSON directly:

- Country and topic data lives in `src/content/jurisdictions/<code >.json`.
- Put the citation directly under the topic it supports.
- Run `pnpm check` and `node scripts/check-sources.mjs` before opening the PR.
- The build will reject any topic that is not `unknown` if it has zero sources.

Then open a PR and tick the checklist in the template. Data-only PRs get reviewed fastest when the
sources are in the description, not only in the diff.

**Labels** get applied automatically to issues as `country: <x>` and `topic: <x>`. If a label looks
wrong, edit the two fields in your issue body and re-save — triage re-runs on edit.

---

## Contributing code

### Setup

```bash
corepack enable            # this repo pins pnpm 12.16.1 in package.json — use pnpm, never npm
pnpm install
pnpm dev                   # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with reload |
| `pnpm build` | Static build into `dist/` |
| `pnpm check` | Build + typecheck + `wrangler deploy --dry-run`. Run this before a PR. |
| `pnpm preview` | Serve the built output under workerd, closest to production |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` after touching `wrangler.json` |

Node >= 22.

### House style

- **Astro first.** Components are `.astro`. Ship zero JavaScript unless something genuinely needs it;
  when it does, prefer a `<script>` scoped to the component over a client:directive framework island.
- **Tailwind v4 utilities** in markup, tokens in `src/styles/global.css`. No CSS files scattered around,
  no `!important`, no inline styles.
- **Don't make it look like every other AI-generated site.** No dark-mode crypto palette, no
  purple-to-blue gradient text, no glowing borders, no emoji in buttons or headings, no uppercase
  tracked category labels. Warm editorial, quiet chrome, one or two deliberate visual moments.
  If you want to check, the `unslop` skill's rules are a decent proxy for our taste.
- **Voice.** Write like a knowledgeable friend, not a law firm and not a brand. Lowercase headings,
  short sentences, no "we're excited to announce", no "empowering individuals to navigate".
  Swearing is allowed. Being vague about a dangerous topic is not.
- **Accessibility is not optional.** Real landmarks, labelled form controls, readable at 200% zoom,
  keyboard-operable, colour never the only signal for legal status (a red dot alone tells a
  colourblind reader nothing). Many of our readers use old phones on bad connections: keep pages
  small and prefer server-rendered HTML.
- **i18n.** English and French. If you add a UI string, think about where translations live before
  hardcoding a second language into a component.

### Pull requests

Keep them focused. One country update, one fix, one feature. Explain *why* and link sources or the
issue being closed. CI does not run arbitrary code from PRs; a maintainer reviews before anything deploys.
`main` auto-deploys to rights.wtf on merge, so a merged PR is a live PR.

Contributions are licensed under MIT, the same as the rest of the repo. By opening a PR you confirm
you have the right to submit it and you're okay with it being public and permanent.

---

## What we will say no to

- Unsourced legal claims, or "sources" that are screenshots with no link.
- Editing a contested fact to match your opinion about the group it concerns.
- Adding a country page from a translated PDF with no check against the current law.
- Dependency bumps nobody asked for, drive-by reformatting, or rewriting things to be cleverer.
- Anything that would put readers at risk: logging IPs we don't need, analytics, third-party embeds
  that phone home, or a "share this page" affordance that leaks a visit to a referrer.
- Piling on in issues. Disagreement about a law is fine; arguing with someone about whether they
  deserve rights is not, and it's a [code of conduct](CODE_OF_CONDUCT.md) thing.

## Before you open an issue

Check the open ones. Then: is the law wrong → correction form. Is the site broken → bug report.
Is something missing → feature request. Think you found a security problem → [SECURITY.md](SECURITY.md),
not a public issue.

We are two students. We may take a while. If a correction is urgent — the site currently says
something false that could get someone hurt — open the issue and mark the title `URGENT`.
