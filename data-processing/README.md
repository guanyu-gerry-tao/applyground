# Applyground Data Processing

This folder prepares sanitized, static JSONL datasets for Applyground scenarios.

The goal is to turn real-source job rows into neutral fake postings that are safe for an automation playground:

- no real employer names, products, URLs, emails, phones, recruiter names, or street addresses
- no real brand styling or official page replication
- no backend or database dependency
- final output is plain JSONL that the frontend can read later

The current committed fixture, `big_company_cs_1000`, is derived from
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs),
the Hugging Face dataset also known as **Open-Apply Jobs**. The upstream dataset
collects active postings from public ATS APIs such as Greenhouse, Lever, and
Ashby. Applyground uses a sampled, sanitized, NPC-renamed derivative, not the raw
upstream rows.

The model-assisted sanitization step uses the
[OpenAI Batch API](https://platform.openai.com/docs/guides/batch) with requests
targeting the Responses endpoint (`/v1/responses`). The checked-in configuration
uses [`gpt-4.1-mini`](https://platform.openai.com/docs/models/gpt-4.1-mini),
which OpenAI documents as supporting both Responses and Batch. See the
[Batch API reference](https://platform.openai.com/docs/api-reference/batch) for
the `completion_window`, `endpoint`, and batch input file requirements.

## Directory Layout

- `raw/` stores local source data, OpenAI Batch inputs, and Batch outputs. It is ignored except for `.gitkeep`.
- `generated/` stores temporary deterministic NPC replacement pools. It is ignored except for `.gitkeep`.
- `output/` stores final or intermediate local JSONL outputs. It is ignored except for `.gitkeep`.
- `prompts/` stores model prompts that are meant to be reviewed and committed.
- `scripts/` stores reusable data-processing scripts and their tests.

## Required Source Dataset Shape

The source dataset should be CSV, JSONL, or Parquet. The main posting pipeline expects these fields:

```json
{
  "id": "greenhouse:example:12345",
  "source_slug": "example-company",
  "title": "Senior Software Engineer, Search Platform",
  "apply_url": "https://real.example/jobs/12345",
  "description_html": "<p>Real posting HTML...</p>",
  "employment_type": "Full-time",
  "department": "Engineering",
  "locations": "Remote",
  "remote": "true",
  "posted_at": "2026-01-01",
  "salary_min": "120000",
  "salary_max": "180000",
  "salary_currency": "USD",
  "salary_period": "year",
  "updated_at": "2026-01-02",
  "date": "2026-01-02",
  "source": "open-apply"
}
```

Only these fields are required by the current scripts:

- `id`: stable source row id. Used to build `custom_id`.
- `source_slug`: source/employer slug. Used for audit and fallback title cleanup.
- `title`: original job title. Sent to the model so it can return a sanitized core title.
- `description_html`: original job posting HTML. Sent to the model for sanitization.

## Final Output Shape

The current final JSONL shape is one object per line:

```json
{
  "id": 0,
  "custom_id": "row-000001-greenhouse:example:12345",
  "title": "Senior Software Engineer",
  "html": "<p>Sanitized posting HTML...</p>",
  "job_level": "senior",
  "job_level_signals": ["senior"],
  "npc_seed": "big-company-cs-000001"
}
```

`title` should be a short core role title only. Do not include employer names, product names, locations, cohorts, dates, years, or team qualifiers.

## Scripts

Production scripts:

- `sample_records.py`: sample CSV or Parquet rows, optionally with keyword and exact filters.
- `submit_batch.py`: create OpenAI Batch JSONL, submit it, check batch status, and download completed batch output.
- `extract_batch_html.py`: extract model output into normalized JSONL. It supports both legacy HTML-only output and the current `{ "title", "html" }` JSON output.
- `generate_npc_pool.py`: generate deterministic fictional replacement values for placeholders such as `{{COMPANY_NAME}}`, `{{NPC_URL}}`, and `{{NPC_ADDRESS}}`.
- `apply_npc_replacements.py`: apply an NPC replacement pool to sanitized JSONL rows.
- `add_job_levels.py`: add `job_level` and `job_level_signals` from the existing sanitized `title` field.

Tests:

- `test_generate_npc_pool.py`
- `test_apply_npc_replacements.py`
- `test_add_job_levels.py`
- `test_extract_batch_html.py`

## Main Workflow

1. Put source files under `data-processing/raw/`.

2. Create a local env file from the example and add your API key. The current
   fixture workflow used OpenAI with `gpt-4.1-mini`:

```bash
cp data-processing/.env.example data-processing/.env
```

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
AI_API_KEY=sk-...
```

3. Create Batch input. Use `--columns title,description_html`; do not use `--text-column description_html`, because the prompt expects both title and HTML.

```bash
python3 data-processing/scripts/submit_batch.py \
  data-processing/prompts/sanitize_job_posting.md \
  data-processing/raw/samples/big_company_cs_1000_part1.csv \
  --columns title,description_html \
  --output data-processing/raw/batches/big_company_cs_1000_part1_html.batch.jsonl
```

Add `--submit` when you are ready to upload and create the OpenAI Batch.

Check or download a submitted Batch:

```bash
python3 data-processing/scripts/submit_batch.py \
  --status-batch batch_xxx

python3 data-processing/scripts/submit_batch.py \
  --download-batch batch_xxx \
  --download-output data-processing/raw/batches/big_company_cs_1000_part1_html.output.jsonl
```

4. After Batch completion, extract the model output:

```bash
python3 data-processing/scripts/extract_batch_html.py \
  data-processing/raw/batches/big_company_cs_1000_part1_html.output.jsonl \
  data-processing/output/big_company_cs_1000.clean_html.jsonl
```

For multiple Batch parts, pass all input files first and the output path last.

5. Generate an NPC pool with the same row count as the clean HTML file:

```bash
python3 data-processing/scripts/generate_npc_pool.py \
  --count 1000 \
  --seed-prefix big-company-cs \
  --output data-processing/generated/big_company_cs_1000_npc_identity_pool.jsonl
```

6. Apply NPC replacements:

```bash
python3 data-processing/scripts/apply_npc_replacements.py \
  data-processing/output/big_company_cs_1000.clean_html.jsonl \
  data-processing/generated/big_company_cs_1000_npc_identity_pool.jsonl \
  data-processing/output/big_company_cs_1000.npc_html.jsonl
```

7. Add level metadata and write the final dataset:

```bash
python3 data-processing/scripts/add_job_levels.py \
  data-processing/output/big_company_cs_1000.npc_html.jsonl \
  data-processing/output/big_company_cs_1000.jsonl
```

## Verification

Run the script tests:

```bash
python3 -m unittest \
  data-processing/scripts/test_generate_npc_pool.py \
  data-processing/scripts/test_apply_npc_replacements.py \
  data-processing/scripts/test_add_job_levels.py \
  data-processing/scripts/test_extract_batch_html.py
```

Check row counts:

```bash
wc -l data-processing/output/big_company_cs_1000.jsonl
```

Check placeholder cleanup:

```bash
rg -o "\\{\\{[A-Z_]+\\}\\}" data-processing/output/big_company_cs_1000.jsonl
```

No output from the `rg` command means no placeholder tokens remain.

## Git Hygiene

Committed files should be scripts, prompts, tests, docs, and `.gitkeep` files.

Local data files under `raw/`, `generated/`, and `output/` are ignored by default. Do not commit real-source data, generated NPC pools, Batch outputs, final JSONL datasets, `.env`, or `__pycache__/`.
