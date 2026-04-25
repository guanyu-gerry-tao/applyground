# Applyground Claude Instructions

使用中文和用户沟通。用户是新手，解释要耐心、具体，不要只给抽象建议。

## 项目长期边界

- 永远不做真实品牌样式或品牌复刻。不要使用真实公司、ATS、招聘平台的 logo、品牌色、官方页面布局、复制 CSS 或复制 DOM。
- 可以中性地模拟常见求职申请表单交互模式，方便 automation agents 打靶，但命名和视觉表达都要保持原创、中性。
- 默认不做真实后端和数据库。提交逻辑应保持 static-only，在前端整理 submission，并在 confirmation/review 页面用 JSON 原样回显。
- 上传文件默认只记录 metadata，例如 `name`、`type`、`size`、`lastModified`。不要上传、保存或持久化文件内容，除非用户明确改变项目边界。

## 文档和实现偏好

- 所有项目文档都要中英并列：英文文件使用默认文件名，例如 `foo.md`；中文文件使用同名 `_zh.md`，例如 `foo_zh.md`。两份文件放在同一目录。
- 更新文档时，同步更新英文版和中文版，避免只改一份导致内容漂移。
- 面向用户沟通使用中文；代码标识符、路由、scenario id、JSON 字段名使用英文，保持自动化工具友好。
- 首页应该是极简 type index：标题、短说明、申请页面类型入口。可以有少量 CSS 让人类可读，但不要酷炫、不要强设计感、不要 marketing hero。
- 点进 type 后进入该类型的 cases 列表页。类型页用 Markdown-like 结构：标题、介绍、bullet list、稳定链接。点进 case 后才进入具体 fake job application 页面。
- 首页和类型页都要优先方便机器、AI agent、Playwright/Selenium 和 LLM 读取。
- 允许描述性提及常见平台类型，例如 `workday-style`，用于说明靶型；但不能使用真实 logo、品牌色、官方 CSS/DOM 或暗示官方关系。
- 新功能优先保持可静态部署，不引入服务端依赖。
