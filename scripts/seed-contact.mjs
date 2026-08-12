/**
 * 写入首页 contact 区块默认 content
 * 用法：node scripts/seed-contact.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, 'company-site-template-main', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const DEFAULT_CONTACT = {
  title: { zh: '联系我们', en: 'Contact Us' },
  tel: { zh: '+63 917 620 0268', en: '+63 917 620 0268' },
  email: {
    zh: 'wintexlogistics@wintex.com.ph',
    en: 'wintexlogistics@wintex.com.ph',
  },
  address: {
    zh: 'U1203, The Trade & Financial Tower ,7th Ave cor 32nd St.,BGC,Taguig City, Philippines',
    en: 'U1203, The Trade & Financial Tower ,7th Ave cor 32nd St.,BGC,Taguig City, Philippines',
  },
};

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();
const { data: existing, error: readErr } = await supabase
  .from('pages')
  .select('slug')
  .eq('slug', 'contact')
  .maybeSingle();

if (readErr) {
  console.error('❌ 读取失败', readErr.message);
  process.exit(1);
}

if (existing) {
  const { error } = await supabase
    .from('pages')
    .update({
      content: DEFAULT_CONTACT,
      draft_content: DEFAULT_CONTACT,
      status: 'published',
      updated_at: now,
      updated_by: 'seed',
    })
    .eq('slug', 'contact');
  if (error) {
    console.error('❌ 更新失败', error.message);
    process.exit(1);
  }
  console.log('✅ 已更新 pages.contact');
} else {
  const { error } = await supabase.from('pages').insert({
    slug: 'contact',
    content: DEFAULT_CONTACT,
    draft_content: DEFAULT_CONTACT,
    status: 'published',
    updated_at: now,
    updated_by: 'seed',
  });
  if (error) {
    console.error('❌ 插入失败', error.message);
    process.exit(1);
  }
  console.log('✅ 已写入 pages.contact');
}
