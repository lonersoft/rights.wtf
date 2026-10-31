<div align="center">

# rights.wtf

> *"no but actually, what the fuck are rights?"*

<img src="https://www.shieldcn.dev/github/stars/lonersoft/rights.wtf.svg?variant=secondary&size=sm" alt="GitHub Stars" /> <img src="https://www.shieldcn.dev/github/forks/lonersoft/rights.wtf.svg?variant=secondary&size=sm" alt="GitHub Forks" /> <img src="https://www.shieldcn.dev/github/contributors/lonersoft/rights.wtf.svg?theme=emerald&size=sm" alt="Contributors" /> <img src="https://www.shieldcn.dev/github/license/lonersoft/rights.wtf.svg?variant=ghost&size=sm" alt="License" />

A plain-language field guide for queer people navigating laws, healthcare, and community around the world.
Researched and built by two queer students, for queer people.

</div>

## Why this exists

When you first realize you’re queer or start questioning your gender, you usually end up sitting in your bedroom with 20 panic tabs open:

- *Can I be fired for this where I live?*
- *Can I legally change my name and ID without surgery or court battles?*
- *Are doctors here going to gatekeep me or try conversion therapy?*
- *Who do I call if my housing or safety falls apart tonight?*

Right now, the answers are buried in 90-page UN reports, unreadable legislative gazettes, or outdated Reddit threads. 

**rights.wtf** is built to replace that panic with direct, verified facts. It's an open-source field guide that tells you what the law actually says, where to find affirming therapists and doctors, and where to find local community and crisis help.

## What we cover
<!-- improve ts ai bullshit cause so many emojies -->

- 🌍 **Legal Reality**: Country and state breakdowns—decriminalization, marriage equality, housing/work protections, legal gender recognition (Self-ID vs court petitions), conversion therapy bans, and asylum.
- 🩺 **Healthcare & Transition**: Finding queer-affirming doctors and therapists, informed consent HRT paths, and avoiding gatekeeping.
- 🆘 **Helplines & Mutual Aid**: Vetted, non-carceral crisis hotlines, LGBTQ+ youth shelters, and student unions.
- 🏳️‍🌈 **Starter Guide**: An unpretentious, zero-pressure guide to identities and questions. (You don't need a fixed label, but having words helps orient you.)

> [!WARNING]
> Before using this as an official source:
>
> We are a group of teenagers that are trying to make this website to help you with your journey as a queer person. However, please keep in mind that we are not your attorneys, and we are not responsible for any legal issues that may arrise up in your country. Laws will always change from time to time, so always verify with attorneys or local advocacy groups.
>
> We try our best to cite our sources, but the sources may not always be correct. If so, please report it to the section below.

1. **We are researchers, not your attorneys.** This is a mutual-aid educational project, not formal legal counsel. Laws shift rapidly; always verify critical decisions with accredited local advocacy groups or attorneys.
2. **Every fact must have a receipt.** All legal claims must cite national legislation, official government gazettes, court rulings, or accredited human rights monitors (ILGA, TGEU, Human Rights Watch).

## Contributing & Fact-Checking

Notice something wrong or outdated for your country? We need your help keeping this website accurate, by doing either steps:

1. **Report a legal correction:** Use our [⚖️ Issue Template](https://github.com/lonersoft/rights.wtf/issues/new/choose) and fill it out properly, it will be sent to one of the maintainers [lolodotzip](https://lolodotzip.me).
2. **Submit a Pull Request:** All PRs updating legal information must include direct links to official legislation or reputable NGO sources.

The longer version lives in [CONTRIBUTING.md](CONTRIBUTING.md) (source rules, setup, house style).
Behaviour in issues and PRs is covered by our [Code of Conduct](CODE_OF_CONDUCT.md) — this project is
about queer people's safety, not open debate about whether they exist. Found something exploitable in
the site or the deploy pipeline? Read [SECURITY.md](SECURITY.md) and email us instead of opening an issue.

## Tech Stack

<img src="https://www.shieldcn.dev/badge/Language-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm" alt="Language · TypeScript" /> <img src="https://www.shieldcn.dev/badge/Framework-Astro-BC52EE.svg?logo=astro&variant=branded&size=sm" alt="Framework · Astro" /> <img src="https://www.shieldcn.dev/badge/Stack-Tailwind_CSS-06B6D4.svg?logo=tailwindcss&variant=branded&size=sm" alt="Tailwind CSS" /> <img src="https://www.shieldcn.dev/badge/Stack-Cloudflare_Workers-F38020.svg?logo=cloudflare&variant=branded&size=sm" alt="Cloudflare Workers" /> <img src="https://www.shieldcn.dev/badge/Package_mgr-pnpm-F69220.svg?logo=pnpm&variant=branded&size=sm" alt="Package mgr · pnpm" /> <img src="https://www.shieldcn.dev/badge/ESM-only-16a34a.svg?variant=secondary&size=sm" alt="ESM only" />

### Local Development

```bash
pnpm install
pnpm dev        # Starts local dev server at localhost:4321
pnpm build      # Builds production worker to dist/
pnpm check      # Typecheck + build verification
pnpm deploy     # Deploy current build to rights.wtf
```

## About & License

<div align="center"><img src="https://www.shieldcn.dev/github/license/lonersoft/rights.wtf.svg?variant=ghost&size=sm" alt="License" />
</div>

Maintained under [**Loners can Make Software d.b.a. Hack Club** (a 501(c)(3) nonprofit)](https://loners.software).  
The source code is MIT, sources are dedicated to the public good.