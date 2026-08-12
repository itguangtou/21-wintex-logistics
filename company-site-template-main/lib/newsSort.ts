import type { SupabaseClient } from '@supabase/supabase-js';

/** 按当前 sort_order 读取 id 列表（稳定次序） */
export async function listNewsIdsOrdered(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('news')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => String(row.id));
}

/** 将有序列表写成连续 1..n */
export async function writeNewsOrder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('news')
      .update({ sort_order: i + 1 })
      .eq('id', orderedIds[i]);
    if (error) throw new Error(error.message);
  }
}

/** 按当前顺序重写为 1..n（删后补洞） */
export async function normalizeNewsSortOrder(supabase: SupabaseClient): Promise<void> {
  const ids = await listNewsIdsOrdered(supabase);
  await writeNewsOrder(supabase, ids);
}

/**
 * 把已存在的新闻放到目标位（1-based），其余顺延，最终保证 1..n。
 * @returns 实际写入的位置
 */
export async function placeNewsAt(
  supabase: SupabaseClient,
  id: string,
  desiredPos: number
): Promise<number> {
  const ids = await listNewsIdsOrdered(supabase);
  if (!ids.includes(id)) throw new Error('新闻不存在');

  const without = ids.filter((x) => x !== id);
  const n = without.length + 1;
  const pos = Math.max(1, Math.min(Math.trunc(desiredPos) || n, n));
  without.splice(pos - 1, 0, id);
  await writeNewsOrder(supabase, without);
  return pos;
}

/**
 * 新建后定位：未指定则追加到末尾；指定则插入该位并重排 1..n。
 */
export async function placeNewNewsAt(
  supabase: SupabaseClient,
  id: string,
  desiredPos?: number | null
): Promise<number> {
  const ids = await listNewsIdsOrdered(supabase);
  const without = ids.filter((x) => x !== id);
  const n = without.length + 1;
  const pos =
    desiredPos == null || !Number.isFinite(desiredPos)
      ? n
      : Math.max(1, Math.min(Math.trunc(desiredPos) || n, n));
  without.splice(pos - 1, 0, id);
  await writeNewsOrder(supabase, without);
  return pos;
}
