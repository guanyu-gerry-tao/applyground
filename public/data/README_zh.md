# Applyground Data Folder

这个目录存放前端会静态加载的 JSONL 数据集。浏览器先读取 `manifest.json`，再加载所选 dataset 的 URL。

> English: [README.md](./README.md)

## 已提交数据集来源

已提交的 `big_company_cs_1000` fixture 派生自 Hugging Face 上的
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs)，
也叫 **Open-Apply Jobs**。上游数据集收集来自公开 ATS API 的 active postings，例如
Greenhouse、Lever、Ashby。

Applyground 不直接发布这些原始行。仓库里的 JSONL 是抽样、脱敏、NPC 重命名后的派生
fixture，用于本地表单自动化测试。

## 数据集格式

每个 dataset 是一个 `.jsonl` 文件。每一行是一个职位对象：

```json
{"custom_id":"example-000001","title":"Software Engineer","html":"<p>Job description HTML.</p>","job_level":"mid","job_level_signals":["mid"]}
```

必填字段：

- `custom_id`：稳定的内部行 key。
- `title`：UI 中展示的职位标题。
- `html`：JD 页面展示的职位描述 HTML。
- `job_level`：首页 level filter 使用的等级标签。
- `job_level_signals`：推导 level 的证据标签。如果没有证据，用空数组。

可选字段：

- `id`：数字行 id。如果省略，Applyground 会使用行号作为内部 id。
- `npc_seed`：历史内部 seed，不在 UI 中展示。

## 添加数据集

1. 在这个目录添加 JSONL 文件，例如 `my_dataset.jsonl`。
2. 在 `manifest.json` 中添加条目：

```json
{
  "label": "my_dataset",
  "url": "/data/my_dataset.jsonl",
  "description": "Short human-readable description.",
  "format": "jsonl",
  "count": 123
}
```

3. 运行 `npm run typecheck` 和 `npm run build`。
4. 打开首页，用 Dataset filter 检查新数据集。

数据集必须保持中性。不要包含真实 logo、真实品牌样式、复制 DOM、复制 CSS，或用户上传文件的内容。
