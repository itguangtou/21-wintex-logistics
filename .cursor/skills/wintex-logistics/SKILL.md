---
name: wintex-logistics
description: >-
  Operate the Wintex Logistics site (21-wintex-logistics): Supabase Postgres
  migrations/seeds, admin CMS work, and Vercel deploy via git push to main.
  Use when editing this repo, changing DB schema/data, deploying, or managing
  /admin, careers, about CMS, or env vars.
---

# Wintex Logistics 运维 Skill

## 立刻记住

- 用户**本地不跑项目**；改完代码必须 **commit + push `main`**，等 Vercel 部署成功后再给链接。
- 应用代码在 `company-site-template-main/`；仓库根目录有 `doc/`、`scripts/`。
- 密钥：先读 [secrets.local.md](secrets.local.md)（gitignored）；也可读 `company-site-template-main/.env.local`。
- 详细表结构见 [schema.md](schema.md)。

## 关键身份

| 项 | 值 |
|----|-----|
| GitHub | https://github.com/itguangtou/21-wintex-logistics |
| 生产站 | https://21-wintex-logistics.vercel.app |
| 管理端 | https://21-wintex-logistics.vercel.app/admin |
| Vercel 项目名 | `21-wintex-logistics` |
| Vercel Root Directory | `company-site-template-main` |
| Supabase URL | `https://dlhhwuuvndwqkkppohie.supabase.co` |
| 管理登录 | 用户名 `wintex` / 密码 `wintex2025`（表 `admin_users`） |

## 技术栈

- Next.js 14 App Router + Tailwind + next-intl（前台 `/zh` `/en`）
- 管理端仅 `/admin`（无 locale 前缀；`/zh/admin` 由 middleware 重定向）
- 数据：**Supabase PostgreSQL**（已弃用 Redis/Upstash）
- 鉴权：`admin_users` + bcrypt + Cookie HMAC（`ADMIN_SESSION_SECRET`）
- 部署：GitHub `main` → Vercel 自动构建

## 标准工作流

### A. 改前端 / 管理端 UI

1. 在 `company-site-template-main/` 改代码
2. `git add` → `git commit` → `git push origin main`
3. 用 `gh api repos/itguangtou/21-wintex-logistics/commits/<sha>/status` 等到 Vercel `success`
4. 回复生产 URL（如 `/admin/pages/about`）

### B. 改数据库（建表 / 改表 / 灌数据）

1. 在 `doc/sql/` 新增或修改 `.sql`（例如 `003_pages.sql`）
2. 仓库根目录执行（需已装依赖，且 `.env.local` 有 `DATABASE_URL`）：

```bash
cd d:/ShanDan/code/21-wintex-logistics
npm run db:migrate -- doc/sql/你的文件.sql
```

3. 种子脚本（根目录）：

```bash
npm run db:seed:careers
npm run db:seed:admin
```

4. 若新表被 Next API 使用：同步改 `company-site-template-main` 代码并 **push 部署**
5. **不要**要求用户去 Supabase 网页点 SQL（除非脚本失败再兜底）

`db-migrate.mjs` 会加载：
- 根目录 `.env.local`
- `company-site-template-main/.env.local`

### C. 环境变量变更

本地：改 `company-site-template-main/.env.local`（及根目录同名文件若存在）。  
生产：Vercel Project → Settings → Environment Variables，改完 **Redeploy**。

必需变量：

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 客户端/服务端 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公开 key |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅服务端 / 脚本 |
| `ADMIN_SESSION_SECRET` | 管理 Cookie 签名（≥16） |
| `DATABASE_URL` | 仅本地迁移脚本（Postgres 直连）；Vercel 上 API 用 service role，一般不必配 |

旧变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 已废弃；登录走 `admin_users`。

## 管理端约定

- Shell：左深蓝侧栏；右 **Head / Body / Foot** 固定高度，**仅 Body 滚动**
- Foot：版权条，不放保存按钮（操作放 Body 内）
- 单项区块用表单行；多项用列表项
- 已接库：招聘 `/admin/careers` → `/api/careers` → `careers_data`
- UI 已做、库待接：关于我们 `/admin/pages/about`（默认文案在 `lib/aboutPageContent.ts`）
- 计划表 `pages`（slug=`about`，`content` JSONB）见 schema；未建则先迁移再写 API

## 代码落点

| 用途 | 路径 |
|------|------|
| Supabase 客户端 | `company-site-template-main/lib/supabase.ts` |
| 鉴权 | `company-site-template-main/lib/auth.ts` |
| 招聘 API | `company-site-template-main/app/api/careers/route.ts` |
| 登录 API | `company-site-template-main/app/api/auth/*` |
| 管理壳 | `company-site-template-main/components/admin/AdminShell.tsx` |
| 关于编辑 UI | `company-site-template-main/components/admin/AboutPageEditor.tsx` |
| 关于页前台 | `company-site-template-main/app/[locale]/about/page.tsx` |
| 计划文档 | `doc/管理端实现.md`、`doc/项目启动.md` |

## 部署检查清单

- [ ] Root Directory 仍是 `company-site-template-main`
- [ ] Vercel 四变量齐全（URL / anon / service_role / ADMIN_SESSION_SECRET）
- [ ] push `main` 后 commit status 为 success
- [ ] `/admin` 能登录；涉及写接口的功能返回非 401

## 禁止

- 不要把 `secrets.local.md` 或 `.env.local` 提交进 Git
- 不要 force-push `main`、不要改 git config
- 不要重新引入 Redis/Upstash
- 用户要部署时不要只改本地不 push
