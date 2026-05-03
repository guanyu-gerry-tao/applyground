# Applyground

> An AI automation test site for job application forms.

A static, MIT-licensed playground for testing job-application form automation.
The pages are neutral, original fixtures: no real brand visuals, no copied DOM,
no backend, and no persisted submissions.

Applyground is safe by design because applications are handled in your browser:
file inputs keep metadata only, submissions stay in `sessionStorage`, and the
default deployment does not collect applicant data. You should still use fake
candidate information here. This is a test target, not a real application
system.

You can run or self-host the project as a normal static Vite site. See
[Local Setup](#local-setup) to start it locally, and open an issue for bugs,
fixture problems, or job-source datasets you would like Applyground to cover.

> 中文版：[README_zh.md](./README_zh.md)

## What It Is

Applyground gives AI browser agents, Playwright, Selenium, and tools like wolf a
stable local target for reading job descriptions, choosing an application form,
submitting fake applications, and inspecting the browser-local result.

The current app has two layers:

- **JSONL job index.** The home page loads static datasets from
  `public/data/manifest.json`, lists paginated job descriptions, supports dataset
  and level filters, and links each row into `/jd`.
- **Scenario library.** The older type/scenario routes remain available as
  stable fixtures for individual form shapes.

Submissions are assembled in the frontend, stored in `sessionStorage`, scored
locally, and echoed back as JSON. Nothing is sent to a server.

## Current Fixtures

The committed static dataset is `big_company_cs_1000`, a 1,000-row JSONL file of
neutralized computer-science job descriptions. Each row has a stable row key,
title, sanitized HTML, job level, level signals, and optional NPC seed metadata.

The source pool for this fixture is
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs),
the Hugging Face dataset also known as **Open-Apply Jobs**. It collects active
job postings from public ATS APIs such as Greenhouse, Lever, and Ashby. The file
shipped in Applyground is a sampled, sanitized, NPC-renamed derivative for local
automation testing, not a raw mirror of the upstream dataset.

The app includes ten application scenarios across five form families:

- `company-careers` - baseline single-page forms.
- `easy-apply` - short multi-step modals with step-gated next/back.
- `workday-style` - multi-page enterprise-ATS-shaped wizards.
- `modern-ats` - compact embedded application forms.
- `edge-cases` - difficult-but-legal fixtures such as ambiguous labels, custom
  dropdowns, shadow DOM, delayed reveal, iframe-style upload, and honeypot fields.

Names like `workday-style` describe an interaction shape only. They do not imply
real brand styling, real platform affiliation, or copied implementation details.

## Project Boundaries

- **No real brand replication.** Do not use real company, ATS, or recruiting
  platform logos, brand colors, official layouts, copied CSS, or copied DOM.
- **Static-only by default.** No backend, database, account system, server-side
  submission, or real upload path.
- **Files are metadata-only.** Uploads record `name`, `type`, `size`, and
  `lastModified`. File bytes are never sent, stored, or persisted.
- **Datasets must stay neutral.** Public JSONL files may contain realistic job
  text, but employer names, URLs, emails, phones, addresses, and recognizable
  brand tokens must be removed or replaced.

## Local Setup

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

## Project Structure

```text
applyground/
├── README.md / README_zh.md          # Project overview in English and Chinese.
├── AGENTS.md / CLAUDE.md             # Agent-facing project instructions.
├── public/
│   └── data/                         # Static JSONL datasets loaded by the browser.
│       ├── manifest.json             # Dataset registry used by the home page.
│       ├── big_company_cs_1000.jsonl # Committed neutralized fixture dataset.
│       └── README.md / README_zh.md  # Dataset format and source notes.
├── src/
│   ├── pages/                        # Route-level pages such as home, JD, score.
│   ├── scenarios/                    # Job application form fixtures.
│   ├── components/                   # Shared form and fixture UI components.
│   ├── data/                         # Scenario metadata and JSONL loaders.
│   ├── lib/                          # Submission, validation, and scoring helpers.
│   ├── types/                        # Shared TypeScript contracts.
│   └── router.tsx                    # React Router route table.
├── data-processing/
│   ├── README.md / README_zh.md      # Sanitization pipeline documentation.
│   ├── prompts/                      # Prompts used for job-posting sanitization.
│   └── scripts/                      # Sampling, Batch, NPC replacement, and tests.
├── package.json                      # Node scripts and frontend dependencies.
├── vite.config.ts                    # Vite build configuration.
└── vercel.json                       # Static SPA deployment fallback.
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Paginated JSONL job index. |
| `/jd?scenarios=:scenarioId&id=:jsonlJobId&dataset=:label` | Application page for one static JD and one form scenario. |
| `/score/:scenarioId?sec=:seconds&filled=:percent&id=:jsonlJobId` | Local score page after submit. The parser also accepts semicolon separators. |
| `/types/:typeId` | Legacy list of scenarios within a form family. |
| `/scenarios/:scenarioId` | Legacy direct scenario page with scenario-specific fallback JD text. |
| `/confirmation/:scenarioId` | Legacy submission echo page with JSON and download. |

Common query flags on `/jd`:

- `platform-style=true` shows a platform-like nearby-jobs layout around the JD.
- `more-style=true` shows a preview first and requires clicking `More` to reveal
  the full JD.

## Submission Shape

See [`src/types/scenario.ts`](src/types/scenario.ts). The contract is versioned
with `version: "0.1.0"`.

Each submission contains candidate fields, answer fields, file metadata,
validation results, rubric score, and raw frontend fields. The latest submission
is stored under `applyground.latestSubmission` in `sessionStorage`. The `/score`
route reports elapsed time and filled percentage for the current JD run.

## Data Files

- `public/data/manifest.json` lists static JSONL datasets the browser can load.
- `public/data/*.jsonl` are frontend-visible datasets.
- `public/data/README.md` documents the browser dataset format.
- `data-processing/` contains the local sanitization pipeline, OpenAI Batch helper
  scripts, NPC replacement scripts, level tagging, and script tests.

Local source data, batch outputs, generated NPC pools, and `.env` files are
ignored by git. Do not commit real-source data or private API keys.

## Data Processing Scripts

The fixture pipeline is documented in
[`data-processing/README.md`](./data-processing/README.md). In short, the scripts
sample Open-Apply source rows, create an OpenAI Batch API JSONL file, sanitize
job postings with `gpt-4.1-mini` through the Responses endpoint, extract the
model output, apply deterministic NPC replacements, and add job-level metadata.

The current Batch configuration lives in
[`data-processing/.env.example`](./data-processing/.env.example):

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
AI_API_KEY=
```

OpenAI references:

- [Batch API guide](https://platform.openai.com/docs/guides/batch)
- [Batch API reference](https://platform.openai.com/docs/api-reference/batch)
- [`gpt-4.1-mini` model reference](https://platform.openai.com/docs/models/gpt-4.1-mini)

## Deploy

Static-only. The repo includes a `vercel.json` with an SPA fallback. To deploy to
Vercel:

1. Sign in at vercel.com with your GitHub account.
2. New Project -> import this repo -> accept the defaults.
3. Vercel auto-detects Vite and deploys on every push to the default branch.

The `dist/` output of `npm run build` works on any static host.

## License

MIT. See [LICENSE](./LICENSE).
