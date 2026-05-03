# Applyground

> 一个 AI 自动化求职申请表单测试网站。

一个 MIT 开源、纯静态的 web playground，用来测试求职申请表单自动化。
所有页面都是中性、原创的 fixtures：不复刻真实品牌视觉、不复制真实 DOM、
不接后端、不持久化提交。

Applyground 的安全边界来自它的浏览器本地设计：文件输入只保留 metadata，
submission 默认只存在 `sessionStorage`，默认部署不会收集申请者数据。即便如此，
你仍然应该只使用虚构的候选人信息；这里是测试靶场，不是真实申请系统。

项目可以像普通静态 Vite 站点一样本地运行或自托管。请阅读
[本地启动](#本地启动) 开始使用；如果发现 bug、fixture 问题，或者希望支持某类
职位来源数据集，也欢迎开 issue。

> English: [README.md](./README.md)

## 它是什么

Applyground 给 AI 浏览器 agent、Playwright、Selenium，以及 wolf 这类工具提供
稳定的本地靶场：读取职位描述、选择申请表单、提交 fake application、查看浏览器
本地计算出的结果。

当前 app 有两层：

- **JSONL job index。** 首页从 `public/data/manifest.json` 加载静态数据集，
  分页展示职位描述，支持按 dataset 和 level 过滤，并把每一行链接到 `/jd`。
- **Scenario library。** 旧的 type/scenario 路由仍然保留，作为单独表单形态的稳定
  fixtures。

提交完全在前端组装，写入 `sessionStorage`，本地评分，再用 JSON 回显。不会发送到
服务器。

## 当前 Fixtures

仓库已提交的静态数据集是 `big_company_cs_1000`，包含 1,000 行中性化后的
computer-science 职位描述。每行包含稳定 row key、title、脱敏 HTML、job level、
level signals，以及可选的 NPC seed metadata。

这个 fixture 的来源池是 Hugging Face 上的
[`edwarddgao/open-apply-jobs`](https://huggingface.co/datasets/edwarddgao/open-apply-jobs)，
也叫 **Open-Apply Jobs**。它收集来自公开 ATS API 的 active job postings，例如
Greenhouse、Lever、Ashby。Applyground 仓库里的文件是抽样、脱敏、NPC 重命名后的
本地自动化测试派生数据，不是上游原始数据集的镜像。

app 里有 5 类表单、共 10 个申请场景：

- `company-careers` — 单页基础表单。
- `easy-apply` — 短多步 modal，next/back 按步骤校验。
- `workday-style` — 多页企业 ATS 形态 wizard。
- `modern-ats` — 紧凑的 embedded 申请表单。
- `edge-cases` — 困难但合法的 fixtures，例如歧义 label、自定义 dropdown、
  shadow DOM、延迟显现、iframe 风格上传、honeypot 字段。

`workday-style` 这类名字只描述交互形态，不表示真实品牌样式、官方关系或复制实现。

## 项目边界

- **不做真实品牌复刻。** 不使用真实公司、ATS、招聘平台的 logo、品牌色、官方页面
  布局、复制 CSS 或复制 DOM。
- **默认纯静态。** 不做后端、数据库、账号系统、服务端提交或真实上传路径。
- **文件只记 metadata。** 上传只记录 `name`、`type`、`size`、`lastModified`。
  文件字节不会发送、保存或持久化。
- **数据集必须保持中性。** public JSONL 可以包含真实感职位文本，但雇主名、URL、
  邮箱、电话、地址、可识别品牌 token 必须删除或替换。

## 本地启动

需要 Node 18 或更高版本。

```sh
git clone <repo-url>
cd applyground
npm install
npm run dev          # http://localhost:5173/
```

其他命令：

```sh
npm run build        # 类型检查 + 生产 build 到 dist/
npm run preview      # 预览生产 build
npm run typecheck    # 严格 TypeScript 检查
```

## 项目文件结构

```text
applyground/
├── README.md / README_zh.md          # 中英文项目说明。
├── AGENTS.md / CLAUDE.md             # 给 coding agent 看的项目指令。
├── public/
│   └── data/                         # 浏览器会静态加载的 JSONL 数据集。
│       ├── manifest.json             # 首页使用的 dataset registry。
│       ├── big_company_cs_1000.jsonl # 已提交的中性化 fixture 数据集。
│       └── README.md / README_zh.md  # 数据格式和来源说明。
├── src/
│   ├── pages/                        # 路由级页面，例如首页、JD、score。
│   ├── scenarios/                    # 求职申请表单 fixtures。
│   ├── components/                   # 共享表单和 fixture UI 组件。
│   ├── data/                         # Scenario metadata 和 JSONL loaders。
│   ├── lib/                          # Submission、validation、scoring helpers。
│   ├── types/                        # 共享 TypeScript contracts。
│   └── router.tsx                    # React Router 路由表。
├── data-processing/
│   ├── README.md / README_zh.md      # 脱敏 pipeline 文档。
│   ├── prompts/                      # 职位文本脱敏用 prompts。
│   └── scripts/                      # 抽样、Batch、NPC 替换和测试脚本。
├── package.json                      # Node scripts 和前端依赖。
├── vite.config.ts                    # Vite build 配置。
└── vercel.json                       # 静态 SPA 部署 fallback。
```

## 路由

| 路由 | 用途 |
| --- | --- |
| `/` | 分页 JSONL job index。 |
| `/jd?scenarios=:scenarioId&id=:jsonlJobId&dataset=:label` | 一个静态 JD + 一个表单 scenario 的申请页。 |
| `/score/:scenarioId?sec=:seconds&filled=:percent&id=:jsonlJobId` | submit 后的本地评分页。解析器也兼容分号分隔参数。 |
| `/types/:typeId` | 旧版：某个表单类型下的 scenario 列表。 |
| `/scenarios/:scenarioId` | 旧版：直接进入某个 scenario，使用该 scenario 自带的 fallback JD。 |
| `/confirmation/:scenarioId` | 旧版：submission JSON 回显和下载页。 |

`/jd` 常用 query flags：

- `platform-style=true` 会在 JD 周围显示 platform-like 的附近职位布局。
- `more-style=true` 会先显示预览，需要点 `More` 才展示完整 JD。

## Submission 结构

详见 [`src/types/scenario.ts`](src/types/scenario.ts)。契约带版本号：
`version: "0.1.0"`。

每次 submission 包含 candidate fields、answer fields、file metadata、validation
结果、rubric score，以及前端原始字段。最新 submission 存在 `sessionStorage` 的
`applyground.latestSubmission`。`/score` 路由会展示当前 JD run 的耗时和填充百分比。

## 数据文件

- `public/data/manifest.json` 列出浏览器可加载的静态 JSONL 数据集。
- `public/data/*.jsonl` 是前端可见的数据集。
- `public/data/README.md` 说明浏览器数据集格式。
- `data-processing/` 包含本地脱敏 pipeline、OpenAI Batch 辅助脚本、NPC 替换脚本、
  level 标注和脚本测试。

本地源数据、Batch 输出、生成的 NPC 池和 `.env` 文件都应该被 git 忽略。不要提交真实
源数据或私有 API key。

## 数据处理脚本

fixture pipeline 详见
[`data-processing/README_zh.md`](./data-processing/README_zh.md)。简短说，脚本会从
Open-Apply source rows 抽样，生成 OpenAI Batch API JSONL，通过 Responses endpoint
使用 `gpt-4.1-mini` 脱敏职位文本，再提取模型输出、应用确定性的 NPC 替换，并补上
job-level metadata。

当前 Batch 配置示例在
[`data-processing/.env.example`](./data-processing/.env.example)：

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
AI_API_KEY=
```

OpenAI 参考文档：

- [Batch API guide](https://platform.openai.com/docs/guides/batch)
- [Batch API reference](https://platform.openai.com/docs/api-reference/batch)
- [`gpt-4.1-mini` model reference](https://platform.openai.com/docs/models/gpt-4.1-mini)

## 部署

纯静态。仓库自带 `vercel.json`，已配置 SPA fallback。部署到 Vercel：

1. 用 GitHub 账号登录 vercel.com。
2. New Project -> 导入该仓库 -> 使用默认配置即可。
3. Vercel 会自动识别 Vite，并在每次推送默认分支时自动部署。

`npm run build` 产出的 `dist/` 也可以放到任何静态服务器。

## 许可证

MIT。见 [LICENSE](./LICENSE)。
