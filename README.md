# Applyground

A static, MIT-licensed playground for testing job-application form automation.
The pages are neutral, original fixtures — no real brand visuals, no copied DOM,
no backend, and no persisted submissions.

> 中文版：[README_zh.md](./README_zh.md)

## What it is

Applyground gives AI browser agents, Playwright, Selenium, and tools like wolf
a stable target with several application-page shapes:

- `company-careers` — single-page baseline forms.
- `easy-apply` — short multi-step modals with step-gated next/back.
- `workday-style` — multi-page enterprise-ATS-shaped wizards.
- `modern-ats` — compact embedded application forms.
- `edge-cases` — documented difficult-but-legal fixtures (ambiguous labels,
  custom dropdown, shadow DOM, delayed reveal, iframe upload, honeypot).

Every category has at least two scenarios. Each scenario builds a typed
submission object on submit, writes it to `sessionStorage`, and routes to a
confirmation page that echoes the JSON and lets you download it.

## Project boundaries

- **No real brand replication.** No real company / ATS / platform logos, brand
  colors, or copied CSS / DOM. Names like `workday-style` describe the *shape*,
  not a brand.
- **Static-only.** No backend, no database, no account system, no real upload.
- **Files are metadata-only.** Uploads record `name`, `type`, `size`,
  `lastModified`. Bytes are never sent or stored.

## Local setup

Requires Node 18 or newer.

```sh
git clone <repo-url>
cd applyground
npm install
npm run dev          # http://localhost:5173/
```

Other commands:

```sh
npm run build        # type-check + production build to dist/
npm run preview      # preview the production build
npm run typecheck    # strict TypeScript check
```

## Routes

| Route                         | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `/`                           | Type index home page.                        |
| `/types/:typeId`              | Scenarios for a given type.                  |
| `/scenarios/:scenarioId`      | A fake application page.                     |
| `/confirmation/:scenarioId`   | Submission echo (JSON + download).           |

## Submission shape

See [`src/types/scenario.ts`](src/types/scenario.ts). The contract is stable
and versioned (`version: "0.1.0"`). Validation and rubric scoring are local and
deterministic. The full JSON is shown on the confirmation page and downloadable.

## Deploy

Static-only. The repo includes a `vercel.json` with an SPA fallback. To deploy
to Vercel:

1. Sign in at vercel.com with your GitHub account.
2. New Project → import this repo → accept the defaults.
3. Vercel auto-detects Vite and deploys on every push to the default branch.

The `dist/` output of `npm run build` works on any static host.

## License

MIT. See [LICENSE](./LICENSE).
