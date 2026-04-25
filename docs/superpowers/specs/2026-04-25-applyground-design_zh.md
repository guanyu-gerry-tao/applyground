# Applyground 设计文档

日期：2026-04-25

## 概要

Applyground 是一个 MIT 开源的静态 Web playground，用来测试 job application form automation。它给 AI browser agents、Playwright、Selenium，以及 wolf 这类求职自动化工具提供安全、稳定、可重复的求职申请表单测试靶场。

这个项目模拟的是 job application / ATS 风格表单里的交互模式和结构难点。它不复刻真实品牌，不提交真实申请，也不把用户数据存到服务器。

## 产品边界

Applyground 有三条长期产品边界：

1. 不做品牌样式。
   - 不把真实公司、ATS 或平台名字当成场景品牌。
   - 可以描述性地提及常见类型，例如 “Workday style”，用于说明靶型；这不是品牌复刻。
   - 不使用真实 logo、不复制真实 CSS、不复制真实 DOM 结构、不复制商标化页面布局，也不做看起来像官方页面的视觉身份。
   - 场景可以“暗搓搓”地模拟常见交互模式，方便 agent 练习和打靶。
   - 场景命名保持中性，例如 `easy-apply-style`、`enterprise-ats-style`、`modern-ats-style`。

2. 默认不做真实后端。
   - 这个应用在可预见的未来保持 static-only。
   - 不做数据库、不做账号系统、不做服务端上传、不做持久化 submission 存储。
   - 部署产物应该可以跑在 GitHub Pages、Netlify、Vercel 静态托管，或任何普通静态文件服务器上。

3. 提交数据以 JSON 原样打回。
   - 用户或 agent 提交表单时，前端组装一个 submission 对象。
   - confirmation 页面把这个对象回显给用户。
   - 用户可以下载 `submission.json`。
   - 文件上传不发送到任何地方。MVP 只记录文件元数据，例如文件名、类型、大小、最后修改时间。

这些边界让 Applyground 能安全地作为自动化测试目标，同时避开隐私、存储、垃圾数据清理、滥用和法律风险。

## 用户和使用场景

主要用户：

- 开发 job application form browser automation 的工程师。
- 需要安全 fill-and-submit 目标的 AI browser agent 作者。
- 需要真实感表单 fixtures 的 Playwright / Selenium 用户。
- 需要 `fill` acceptance test target 的 wolf 类工具。

主要使用场景：

- 用候选人 profile 练习填写求职申请表。
- 验证自动化工具能否处理常见 ATS 表单结构。
- 捕获确定性的 JSON submission，用来做自动化评分。
- 不接触真实求职平台，也能复现困难的 browser-agent case。

非目标：

- 真实 job board。
- 雇主后台。
- 候选人账号。
- 持久化存储。
- 邮件发送。
- 真实简历解析。
- 品牌复刻。

## 技术架构

Applyground 是一个 Vite + React + TypeScript 应用。

推荐依赖：

- Vite：构建和本地开发。
- React：UI。
- TypeScript：scenario 和 submission 契约。
- React Router：scenario 和 confirmation 路由。
- Playwright：项目自测。

应用是静态的。运行时状态放在浏览器存储里：

- `sessionStorage` 保存最近一次 submitted object，供 review 页面读取。
- `localStorage` 未来可以存可选的本地偏好，但默认不存 candidate submitted data。

表单提交不应该依赖网络请求。submit 路径是：

1. Agent 填写 scenario form。
2. Agent 点击 submit。
3. 前端校验 required fields。
4. 前端把 form state 归一化成 typed JSON object。
5. 前端把 JSON object 写入 `sessionStorage`。
6. 前端跳转 confirmation 页面。
7. Confirmation 页面展示 JSON、scenario score、validation result 和下载按钮。

## 路由

初始路由：

- `/`
  - 极简类型目录。
  - 只有页面标题、短描述，以及几个申请页面类型入口。
  - 类型入口可以是 `easy-apply`、`workday-style`、`company-careers`、`modern-ats`、`edge-cases` 这类靶型。
  - 首页不直接列全部 cases，也不直接进入正式模拟。
  - 这个页面优先服务机器、AI agent 和测试脚本读取，不做酷炫 hero 或复杂视觉设计。

- `/types/:typeId`
  - 某一类申请页面的 case 列表页。
  - 页面上方是标题和介绍，说明这类页面测试什么。
  - 页面下方用 bullet list 列出该类型下的一个或多个 fake job application cases。
  - 每个 bullet 包含稳定 URL、case 名称、难度、目标能力和简短说明。

- `/scenarios/:scenarioId`
  - 正式运行某一个 fake job application scenario。
  - 使用 scenario metadata 渲染标题、job context、form surface 和 expected rubric。

- `/confirmation/:scenarioId`
  - 从 `sessionStorage` 读取最近一次 submission。
  - 展示结构化 review、validation result 和 raw JSON。
  - 提供 `submission.json` 下载。

- `/fixtures`
  - 可选轻量页面，列出内置 sample resumes、job descriptions 和 candidate profiles。
  - 如果 MVP 时间紧，可以延后。

## Type 和 Scenario 模型

每个 type 应该定义：

- `id`
- `title`
- `description`
- `examples`
- `scenarioIds`
- `notes`

Type 是首页入口，不一定等于一个具体模拟页面。一个 type 下面可以有多个 scenarios。例如 `workday-style` 下面可以有基础 wizard、长表单 wizard、validation-heavy wizard 等多个 cases。

每个 scenario 应该定义：

- `id`
- `typeId`
- `title`
- `level`
- `description`
- `job`
- `expectedFields`
- `difficultyTags`
- `rubric`
- `component`

难度等级：

- Level 1：标准、可访问性友好的表单。
- Level 2：真实但不刁钻。
- Level 3：ATS 风格复杂 DOM。
- Level 4：故意难用，但仍然合法可操作。
- Level 5：edge cases / agent stress test。

Type metadata 和 scenario metadata 应该和渲染代码分开，这样测试和文档可以复用。

## MVP Scenarios

MVP 首页先展示这些 type：

- `company-careers`
  - 描述：公司官网式申请页面。
  - 初始 case：`simple-company-form`。

- `easy-apply`
  - 描述：短流程、modal、多步骤申请页面。
  - 初始 case：`easy-apply-style`。

- `workday-style`
  - 描述：大型企业 ATS wizard 靶型。允许描述性使用这个名字来帮助测试者理解类别，但不复刻任何真实品牌视觉或 DOM。
  - 初始 case：`enterprise-ats-style`。

- `modern-ats`
  - 描述：现代、紧凑、嵌入式 ATS 申请页面。
  - 初始 case：`modern-ats-style`。

- `edge-cases`
  - 描述：困难控件、模糊标签、延迟区域、shadow DOM 等压力测试。
  - 初始 case：`hostile-edge-cases`。

### 1. `simple-company-form`

目的：基准一页公司官网式申请表。

功能：

- 标准 label 和 input。
- 姓名、邮箱、电话、地点。
- Resume upload。
- Portfolio 或 professional profile URL 字段，命名保持中性。
- 基础 screening questions。
- 直接、清晰的 validation。

预期难度：Level 1。

### 2. `easy-apply-style`

目的：模拟短表单、多步骤 modal application pattern。

功能：

- Job detail page 上有 apply button。
- Multi-step modal。
- Next / back controls。
- Resume upload。
- 联系方式字段。
- Screening questions。
- 当前 step 未通过校验时，submit 或 next button disabled。

预期难度：Level 2。

### 3. `enterprise-ats-style`

目的：模拟大型 ATS 风格 wizard，包含更深结构和更多 required data。

功能：

- Multi-page wizard。
- 深层嵌套布局。
- Required validation。
- Custom select 或 autocomplete。
- Address block。
- Work authorization。
- 中性措辞的 EEO-style optional questions。
- Validation summary。

预期难度：Level 3。

### 4. `modern-ats-style`

目的：模拟干净、紧凑、现代 ATS 风格申请页，但不做品牌模仿。

功能：

- Job page + embedded application form。
- Resume 和 cover letter upload metadata。
- Links section。
- Short-answer questions。
- 干净、真实感强的布局。
- 紧凑 field grouping。

预期难度：Level 2。

### 5. `hostile-edge-cases`

目的：专门测试困难但合法的 browser automation case。

功能：

- Duplicate labels。
- Ambiguous field names。
- Hidden honeypot-like fields：这些字段不应该被填写，并且要在文档中明确说明它们是测试 fixture。
- Delayed section reveal。
- Shadow DOM field。
- Iframe-like upload area。
- Weird custom dropdown。
- 第一次 validation fail，然后 retry。

预期难度：Level 5。

## Component 设计

初始组件分组：

- Shared layout：
  - `AppShell`
  - `ScenarioIndex`
  - `ScenarioHeader`
  - `ScenarioFrame`
  - `ConfirmationReview`

- Form primitives：
  - `Field`
  - `FileInput`
  - `ValidationSummary`
  - `JsonDownloadButton`

- Difficult interaction fixtures：
  - `WeirdSelect`
  - `DelayedSection`
  - `ShadowField`
  - `IframeUpload`
  - `MultiStepModal`
  - `AmbiguousLabelGroup`
  - `ConditionalQuestion`

每个困难 fixture 仍然应该能用普通浏览器 API 合法操作。目标是测试自动化韧性，不是制造不可能完成的页面。

## Submission Contract

每次 submission 都应该遵循稳定结构：

```json
{
  "app": "applyground",
  "version": "0.1.0",
  "scenarioId": "simple-company-form",
  "submittedAt": "2026-04-25T00:00:00.000Z",
  "candidate": {
    "fullName": "Example Candidate",
    "email": "candidate@example.com"
  },
  "answers": {
    "workAuthorization": "yes",
    "requiresSponsorship": "no"
  },
  "files": [
    {
      "field": "resume",
      "name": "resume.pdf",
      "type": "application/pdf",
      "size": 12345,
      "lastModified": 1777075200000
    }
  ],
  "validation": {
    "passed": true,
    "missingRequiredFields": [],
    "warnings": []
  },
  "score": {
    "passed": true,
    "points": 10,
    "maxPoints": 10,
    "notes": []
  },
  "raw": {
    "fields": {}
  }
}
```

规则：

- 原样保留用户输入值。
- 不偷偷修正用户输入。
- 包含足够 metadata，方便测试验证行为。
- MVP 不包含二进制文件内容。
- schema 要有版本概念，方便未来 scenario 安全演进。

## Validation 和 Scoring

Validation 是本地且确定性的。

Required fields 应该产生：

- Inline field errors。
- Submit fail 时的 summary。
- 如果某个 scenario 故意允许 failure 后进入 review，则输出 failed validation object。

第一版 scoring 保持简单：

- Required fields 是否存在。
- Expected screening answers 是否存在。
- 必需文件的 metadata 是否被捕获。
- Hostile scenario 中 hidden fields 是否被避开。
- Conditional fields 是否只在相关条件下完成。

Score 不用来判断真实候选人质量。它只判断自动化流程是否正确完成目标 scenario。

## Fixtures

Public fixtures 可以包含：

- Sample resumes。
- Sample cover letters。
- Sample job descriptions。
- Candidate profiles。

Fixtures 必须是合成数据，并且可以安全公开。

建议路径：

```text
public/
  fixtures/
    resumes/
    cover-letters/
    jd/
src/
  data/
    candidateProfiles.ts
    jobs.ts
    scenarioRubrics.ts
```

## 视觉方向

Applyground 应该像一个实用的开发者测试工具，而不是 marketing site。首页尤其应该像一份机器友好的靶型目录，而不是有强设计感的产品首页。

视觉原则：

- 中性、原创的产品身份。
- 首页只放标题、短描述和申请页面类型入口。
- 类型页使用 Markdown-like 信息结构：标题、介绍、bullet list、稳定链接。
- 首页可以有少量 CSS，让人类可读，但不要酷炫、不要复杂布局、不要大图、不要 marketing hero。
- 优先语义 HTML，方便浏览器 agent、screen reader、Playwright/Selenium selector 和 LLM 读取。
- 点进 type 后看到 cases，点进 case 后才进入具体 fake job application 页面；这些页面可以按目标难度模拟不同表单结构。
- Scenario 页面干净但不过度精致。
- 清晰的 scenario difficulty labels。
- 信息密度足够高，适合反复测试。
- 不使用真实品牌颜色、logo 或复制来的布局。
- 不同 scenarios 可以有不同的中性样式，让 agent 面对多样化表面。

第一屏应该是可用的 type index，不是 landing page hero。

## 测试策略

MVP tests 使用 Playwright。

核心测试：

- Home page 渲染全部申请页面类型入口。
- 每个 type page 渲染该类型下的 case bullet list。
- 每个 scenario route 可以加载。
- `simple-company-form` 可以被填写并提交。
- Confirmation page 显示 JSON 和 download button。
- Required validation 会阻止不完整提交。
- `hostile-edge-cases` 暴露预期的困难 fixtures。

后续测试：

- 用内置 candidate profile 完成每个 scenario。
- 保存 downloaded JSON，并和 expected schema 对比。
- 为每个 scenario 测 mobile viewport。
- 为 wolf 这类工具提供外部 acceptance script。

## 文档

初始文档：

- `README.md`
  - 项目目的。
  - 不做品牌样式和不做后端的边界。
  - 如何本地运行。
  - 如何作为 automation target 使用。
  - Scenario list。

- `docs/scenarios.md`
  - Type 和 scenario 详情、目标交互和 scoring rubric。

- `docs/submission-schema.md`
  - JSON contract 和 examples。

## 实现计划预览

下一阶段实现应该：

1. 初始化 Vite + React + TypeScript。
2. 添加 routing 和 app shell。
3. 添加 type metadata、scenario metadata 和 shared submission types。
4. 实现 fake submit 和 confirmation review。
5. 实现五个 MVP scenarios。
6. 添加 Playwright smoke tests。
7. 更新 README 和 docs。
8. 运行 build 和 tests。

## Open Decisions

MVP 没有阻塞性待决问题。

合理默认值：

- 除非用户指定 pnpm，否则使用 npm。
- 使用 React Router 做 routing。
- 先使用 plain CSS modules 或一个小型 global CSS 文件，等模式稳定后再考虑组件库。
- 只在 `sessionStorage` 保存最近一次 submission。
- 不持久化 uploaded file contents。
