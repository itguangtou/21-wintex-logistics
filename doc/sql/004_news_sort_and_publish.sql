-- 新闻：排序改为连续 1,2,3…；有记录即发布（去掉草稿语义）
UPDATE news
SET is_published = true
WHERE is_published IS DISTINCT FROM true;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order ASC, published_at DESC NULLS LAST, id ASC) AS rn
  FROM news
)
UPDATE news n
SET sort_order = ordered.rn
FROM ordered
WHERE n.id = ordered.id;
