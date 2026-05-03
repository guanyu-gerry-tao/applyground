# Applyground Data Folder

This folder stores static JSONL datasets loaded by the frontend. The browser reads `manifest.json`, then loads the selected dataset URL.

> 中文版：[README_zh.md](./README_zh.md)

## Committed Dataset Source

The committed `big_company_cs_1000` fixture is derived from
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs),
the Hugging Face dataset also known as **Open-Apply Jobs**. The upstream dataset
collects active postings from public ATS APIs such as Greenhouse, Lever, and
Ashby.

Applyground does not ship those raw rows directly. The checked-in JSONL is a
sampled, sanitized, NPC-renamed derivative intended for local form-automation
testing.

## Dataset Format

Each dataset is a `.jsonl` file. Each line is one job object:

```json
{"custom_id":"example-000001","title":"Software Engineer","html":"<p>Job description HTML.</p>","job_level":"mid","job_level_signals":["mid"]}
```

Required fields:

- `custom_id`: stable internal row key.
- `title`: title shown in the UI.
- `html`: job description HTML shown on the JD page.
- `job_level`: level tag used by the homepage filter.
- `job_level_signals`: level evidence tags. Use an empty array if none.

Optional fields:

- `id`: numeric row id. If omitted, Applyground uses the line index as an internal id.
- `npc_seed`: legacy internal seed. Not shown in the UI.

## Add A Dataset

1. Add a JSONL file to this folder, for example `my_dataset.jsonl`.
2. Add an entry to `manifest.json`:

```json
{
  "label": "my_dataset",
  "url": "/data/my_dataset.jsonl",
  "description": "Short human-readable description.",
  "format": "jsonl",
  "count": 123
}
```

3. Run `npm run typecheck` and `npm run build`.
4. Open the homepage and use the Dataset filter.

Keep datasets neutral. Do not include real logos, real brand styling, copied DOM, copied CSS, or file contents uploaded by users.
