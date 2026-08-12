# Wintex DB Schema

## 已有表（`doc/sql/001_init_schema.sql` + `002_admin_users.sql`）

### `admin_users`
- `id` UUID PK
- `username` TEXT UNIQUE
- `password_hash` TEXT（bcrypt）
- `role` TEXT default `admin`
- `is_active` BOOLEAN
- `created_at` / `updated_at`

初始账号：`wintex` / `wintex2025`（`npm run db:seed:admin`）

### `careers_data`
- `id` TEXT PK（固定 `'main'`）
- `data` JSONB（`{ jobs, contact }`；招聘字段语言键为 `cn`/`en`）
- `updated_at`

### `page_sections`
- `(page_slug, section_key)` UNIQUE
- `content_zh` / `content_en` JSONB
- 早期方案；关于我们 CMS **优先用下方 `pages` 表**（整页一条）

### `news`
- `id`, `title_zh/en`, `content_zh/en`, `image_url`, `published_at`, `sort_order`, `is_published`
- API：`/api/news`、`/api/news/[id]`；前台 SSR：`loadPublishedNews` / `loadNewsById`
- Seed：`npm run db:seed:news`

### `equipment` / `timeline_items` / `site_settings`
- 见 `001_init_schema.sql`；列表型 CMS 后续用

## 计划表 `pages`（关于我们等，已建）

```sql
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,                 -- 'about' | 'home' | ...
  content JSONB NOT NULL DEFAULT '{}',   -- 前台已发布
  draft_content JSONB,                  -- 管理端草稿
  status TEXT NOT NULL DEFAULT 'published',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);
```

API：`GET/PUT /api/pages/[slug]`（PUT 需登录；`mode: draft|publish`；已支持 `about` / `mission`）
Seed：`npm run db:seed:about` / `npm run db:seed:mission`

### `about` 的 `content` 形状

见 `company-site-template-main/lib/aboutPageContent.ts` 的 `AboutPageContent`：

- `backgroundImage`, `network.centerLogo`
- `intro[]`: `{ title:{zh,en}, body:[{zh,en}, ...] }`
- `network.items[]`: `{ zh, en }` × 5

### `mission` 的 `content` 形状

见 `company-site-template-main/lib/missionPageContent.ts`：

- `header.title` / `header.subtitle`
- `focus.label` / `focus.body`
- `focus.cards[]`: `{ image, title:{zh,en}, caption:{zh,en} }`

时间轴列表：`timeline_items` + `GET/POST /api/timeline` + `PUT/DELETE /api/timeline/[id]`

## 迁移命令

```bash
# 仓库根目录
node scripts/db-migrate.mjs doc/sql/001_init_schema.sql
node scripts/db-migrate.mjs doc/sql/002_admin_users.sql
node scripts/db-migrate.mjs doc/sql/003_pages.sql
npm run db:seed:about
npm run db:seed:mission
```

或 `npm run db:migrate -- doc/sql/003_pages.sql`
