# Applyground 数据处理

这个目录负责为 Applyground 场景准备脱敏后的静态 JSONL 数据集。

目标是把真实来源的职位行处理成中性的假职位页面，适合 automation playground 使用：

- 不保留真实雇主名、产品名、URL、邮箱、电话、招聘联系人、街道地址
- 不做真实品牌样式或官方页面复刻
- 不依赖真实后端或数据库
- 最终输出是普通 JSONL，后续前端可以静态读取

当前已提交的 fixture `big_company_cs_1000` 派生自 Hugging Face 上的
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs)，
也叫 **Open-Apply Jobs**。上游数据集收集来自公开 ATS API 的 active postings，例如
Greenhouse、Lever、Ashby。Applyground 使用的是抽样、脱敏、NPC 重命名后的派生数据，
不是上游原始行。

模型辅助脱敏步骤使用
[OpenAI Batch API](https://platform.openai.com/docs/guides/batch)，每条 Batch request
指向 Responses endpoint（`/v1/responses`）。当前已提交 fixture 的配置使用
[`gpt-4.1-mini`](https://platform.openai.com/docs/models/gpt-4.1-mini)，OpenAI 文档中
该模型支持 Responses 和 Batch。`completion_window`、`endpoint`、Batch input file 等
要求见 [Batch API reference](https://platform.openai.com/docs/api-reference/batch)。

## 目录结构

- `raw/` 放本地源数据、OpenAI Batch 输入和 Batch 输出。除 `.gitkeep` 外默认忽略。
- `generated/` 放临时生成的 NPC 替换池。除 `.gitkeep` 外默认忽略。
- `output/` 放最终或中间 JSONL 输出。除 `.gitkeep` 外默认忽略。
- `prompts/` 放需要 review 和提交的模型 prompt。
- `scripts/` 放可复用的数据处理脚本和测试。

## 源数据集需要的结构

源数据可以是 CSV、JSONL 或 Parquet。主职位处理流程预期字段如下：

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

当前脚本真正需要的是：

- `id`：稳定的源数据行 ID，用来生成 `custom_id`。
- `source_slug`：来源/雇主 slug，用来审计和兜底清理 title。
- `title`：原始职位标题。会发给模型，让模型返回脱敏后的核心 title。
- `description_html`：原始职位 HTML。会发给模型做正文脱敏。

## 最终输出结构

当前最终 JSONL 每行是一个对象：

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

`title` 应该只保留短的核心职位名。不要包含雇主名、产品名、地点、批次、日期、年份、团队限定词。

## 脚本说明

生产脚本：

- `sample_records.py`：从 CSV 或 Parquet 中抽样，可按关键词和精确条件过滤。
- `submit_batch.py`：从源数据生成 OpenAI Batch JSONL、提交 Batch、查询 Batch 状态、下载完成后的 Batch 输出。
- `extract_batch_html.py`：把模型返回提取成规范 JSONL。兼容旧的 HTML-only 输出，也支持当前 `{ "title", "html" }` JSON 输出。
- `generate_npc_pool.py`：确定性生成虚构替换值，例如 `{{COMPANY_NAME}}`、`{{NPC_URL}}`、`{{NPC_ADDRESS}}`。
- `apply_npc_replacements.py`：把 NPC 替换池应用到脱敏 JSONL。
- `add_job_levels.py`：从已有的脱敏 `title` 字段推导 `job_level` 和 `job_level_signals`。

测试脚本：

- `test_generate_npc_pool.py`
- `test_apply_npc_replacements.py`
- `test_add_job_levels.py`
- `test_extract_batch_html.py`

## 主流程

1. 把源文件放到 `data-processing/raw/` 下。

2. 从示例创建本地 env 文件，并填入 API key。当前 fixture workflow 使用 OpenAI 和
   `gpt-4.1-mini`：

```bash
cp data-processing/.env.example data-processing/.env
```

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
AI_API_KEY=sk-...
```

3. 创建 Batch 输入。这里要用 `--columns title,description_html`，不要再用 `--text-column description_html`，因为 prompt 需要同时看到 title 和 HTML。

```bash
python3 data-processing/scripts/submit_batch.py \
  data-processing/prompts/sanitize_job_posting.md \
  data-processing/raw/samples/big_company_cs_1000_part1.csv \
  --columns title,description_html \
  --output data-processing/raw/batches/big_company_cs_1000_part1_html.batch.jsonl
```

准备好上传时再加 `--submit` 创建 OpenAI Batch。

查询或下载已提交的 Batch：

```bash
python3 data-processing/scripts/submit_batch.py \
  --status-batch batch_xxx

python3 data-processing/scripts/submit_batch.py \
  --download-batch batch_xxx \
  --download-output data-processing/raw/batches/big_company_cs_1000_part1_html.output.jsonl
```

4. Batch 完成后提取模型输出：

```bash
python3 data-processing/scripts/extract_batch_html.py \
  data-processing/raw/batches/big_company_cs_1000_part1_html.output.jsonl \
  data-processing/output/big_company_cs_1000.clean_html.jsonl
```

如果有多个 Batch 分片，先传所有输入文件，最后一个参数放输出路径。

5. 按 clean HTML 的行数生成 NPC 池：

```bash
python3 data-processing/scripts/generate_npc_pool.py \
  --count 1000 \
  --seed-prefix big-company-cs \
  --output data-processing/generated/big_company_cs_1000_npc_identity_pool.jsonl
```

6. 应用 NPC 替换：

```bash
python3 data-processing/scripts/apply_npc_replacements.py \
  data-processing/output/big_company_cs_1000.clean_html.jsonl \
  data-processing/generated/big_company_cs_1000_npc_identity_pool.jsonl \
  data-processing/output/big_company_cs_1000.npc_html.jsonl
```

7. 加上职位等级并写最终数据集：

```bash
python3 data-processing/scripts/add_job_levels.py \
  data-processing/output/big_company_cs_1000.npc_html.jsonl \
  data-processing/output/big_company_cs_1000.jsonl
```

## 验证

运行脚本测试：

```bash
python3 -m unittest \
  data-processing/scripts/test_generate_npc_pool.py \
  data-processing/scripts/test_apply_npc_replacements.py \
  data-processing/scripts/test_add_job_levels.py \
  data-processing/scripts/test_extract_batch_html.py
```

检查行数：

```bash
wc -l data-processing/output/big_company_cs_1000.jsonl
```

检查占位符是否清干净：

```bash
rg -o "\\{\\{[A-Z_]+\\}\\}" data-processing/output/big_company_cs_1000.jsonl
```

这个 `rg` 命令没有输出，就表示没有残留 `{{TOKEN}}`。

## Git 卫生

应该提交的是脚本、prompt、测试、文档和 `.gitkeep`。

`raw/`、`generated/`、`output/` 下的本地数据文件默认忽略。不要提交真实源数据、生成的 NPC 池、Batch 输出、最终 JSONL 数据集、`.env` 或 `__pycache__/`。
