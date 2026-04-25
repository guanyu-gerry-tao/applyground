# Applyground

一个 MIT 开源、纯静态的 web playground，用来测试求职申请表单的自动化。
所有页面都是中性、原创的 fixtures — 不复刻任何真实品牌视觉、不抄真实 DOM、
不接后端、不持久化任何提交。

> English: [README.md](./README.md)

## 它是什么

Applyground 给 AI 浏览器 agent、Playwright、Selenium，以及 wolf 这类工具
提供稳定的求职申请表单靶场，覆盖几种常见页面形态：

- `company-careers` — 单页基础表单。
- `easy-apply` — 短多步 modal，next/back 按步校验。
- `workday-style` — 多页企业 ATS 风格 wizard。
- `modern-ats` — 紧凑的 embedded 申请表单。
- `edge-cases` — 已注明的困难但合法的 fixtures（歧义 label、自定义
  dropdown、shadow DOM、延迟显现、iframe 上传、honeypot）。

每个类型都至少有两个 scenario。每个 scenario 在 submit 时生成一个带类型的
submission 对象，写入 `sessionStorage`，再跳转到 confirmation 页回显 JSON 并
提供下载。

## 项目边界

- **不做真实品牌复刻。** 不抄任何真实公司 / ATS / 招聘平台的 logo、品牌色，
  不复制 CSS / DOM。`workday-style` 这种名字描述的是**形态**，不是品牌。
- **纯静态。** 不做后端、不做数据库、不做账号、不做真实上传。
- **文件只记 metadata。** 上传只记录 `name`、`type`、`size`、`lastModified`。
  文件字节永远不发送、不保存。

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

## 路由

| 路由                          | 用途                                  |
| ----------------------------- | ------------------------------------- |
| `/`                           | 类型目录首页。                        |
| `/types/:typeId`              | 该类型下的 scenario 列表。            |
| `/scenarios/:scenarioId`      | 一个 fake application 页面。          |
| `/confirmation/:scenarioId`   | submission 回显（JSON + 下载）。      |

## Submission 结构

详见 [`src/types/scenario.ts`](src/types/scenario.ts)。契约稳定且带版本号
（`version: "0.1.0"`）。校验与 rubric 评分都是本地、确定性的。完整 JSON 在
confirmation 页面展示，并支持下载。

## 部署

纯静态。仓库自带 `vercel.json`，已配置 SPA fallback。部署到 Vercel 步骤：

1. 用 GitHub 账号登录 vercel.com。
2. New Project → 导入该仓库 → 用默认配置即可。
3. Vercel 会自动识别 Vite，并在每次推送默认分支时自动部署。

`npm run build` 产出的 `dist/` 也能丢到任何静态服务器跑。

## 许可证

MIT。见 [LICENSE](./LICENSE)。
