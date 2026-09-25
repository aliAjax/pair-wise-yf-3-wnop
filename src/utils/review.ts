import type { SmellMemory, SmellType } from './constants';
import { getAverageIntensity } from './helpers';

/** 参与月度归档的地点（按出现次数排序的快照） */
export interface ReviewLocation {
  name: string;
  count: number;
}

/** 参与月度归档的气味类型分布（按出现次数排序的快照） */
export interface ReviewType {
  type: SmellType;
  count: number;
}

/** 某个月的归档回顾：保存时计算一次，之后不随记忆的编辑/删除而变化 */
export interface MonthlyReview {
  /** 归档所属月份，形如 2026-09 */
  month: string;
  /** 参与归档的记忆条数（当前筛选结果） */
  memory_count: number;
  /** 平均气味强度（保留一位小数） */
  avg_intensity: number;
  /** 最常见气味类型；记忆数为 0 时为 null */
  top_type: SmellType | null;
  /** 「想再闻」的数量 */
  want_again_count: number;
  /** 参与归档的地点快照 */
  locations: ReviewLocation[];
  /** 参与归档的气味类型分布快照 */
  types: ReviewType[];
  /** 首次归档时间 */
  created_at: string;
  /** 最近一次更新归档的时间 */
  saved_at: string;
}

/** 把日期转成月份键，形如 2026-09（按本地时区） */
export function getMonthKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 月份键转成展示文案，如 2026-09 → 2026 年 09 月 */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  return `${y} 年 ${m} 月`;
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyOf(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
}

/**
 * 基于当前筛选结果生成当月回顾快照。
 * 快照内联保存统计结果与参与归档的地点/类型，
 * 之后记忆被编辑或清理都不会改写这里的数字。
 */
export function buildMonthlyReview(
  memories: SmellMemory[],
  month: string = getMonthKey(),
  now: string = new Date().toISOString(),
): MonthlyReview {
  const typeCounts = countBy(memories, (m) => m.smell_type);
  const topTypeEntry = [...typeCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  })[0];

  const locationCounts = countBy(memories, (m) => m.location.trim());
  const locations: ReviewLocation[] = [...locationCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));

  const types: ReviewType[] = [...typeCounts.entries()]
    .map(([type, count]) => ({ type: type as SmellType, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    month,
    memory_count: memories.length,
    avg_intensity: getAverageIntensity(memories),
    top_type: topTypeEntry ? (topTypeEntry[0] as SmellType) : null,
    want_again_count: memories.filter((m) => m.want_again).length,
    locations,
    types,
    created_at: now,
    saved_at: now,
  };
}

/** 列表排序：月份从近到远 */
export function sortReviewsDesc(reviews: MonthlyReview[]): MonthlyReview[] {
  return [...reviews].sort((a, b) => b.month.localeCompare(a.month));
}
