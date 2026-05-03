# Applyground Data Folder

This folder stores static JSONL datasets loaded by the frontend. The browser reads `manifest.json`, then loads the selected dataset URL.

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
