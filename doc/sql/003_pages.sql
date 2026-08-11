-- 整页 CMS（关于我们等）
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}',
  draft_content JSONB,
  status TEXT NOT NULL DEFAULT 'published',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

DROP TRIGGER IF EXISTS tr_pages ON pages;
CREATE TRIGGER tr_pages BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
