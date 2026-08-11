-- Wintex Logistics 初始表结构
-- 由 scripts/db-migrate.mjs 执行，无需打开 Supabase 网页

-- 站点配置（联系信息、SEO 等）
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 页面内容块（首页、关于我们等）
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content_zh JSONB DEFAULT '{}',
  content_en JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, section_key)
);

-- 新闻
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title_zh TEXT,
  title_en TEXT,
  content_zh TEXT,
  content_en TEXT,
  image_url TEXT,
  published_at DATE,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 招聘（整包 JSON，兼容现有结构）
CREATE TABLE IF NOT EXISTS careers_data (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 装备清单
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name_zh TEXT,
  name_en TEXT,
  description_zh TEXT,
  description_en TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 使命页时间轴
CREATE TABLE IF NOT EXISTS timeline_items (
  id SERIAL PRIMARY KEY,
  year TEXT NOT NULL,
  project_name_zh TEXT,
  project_name_en TEXT,
  description_zh TEXT,
  description_en TEXT,
  parent_group INT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_site_settings ON site_settings;
CREATE TRIGGER tr_site_settings BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_page_sections ON page_sections;
CREATE TRIGGER tr_page_sections BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_news ON news;
CREATE TRIGGER tr_news BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_careers ON careers_data;
CREATE TRIGGER tr_careers BEFORE UPDATE ON careers_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_equipment ON equipment;
CREATE TRIGGER tr_equipment BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_timeline ON timeline_items;
CREATE TRIGGER tr_timeline BEFORE UPDATE ON timeline_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
