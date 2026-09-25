import type { SmellMemory, SmellType } from './constants';
import { SMELL_TYPES } from './constants';
import { getAverageIntensity } from './helpers';

/** 参与归档的记忆快照：只保留回顾需要的字段，后续编辑/删除原记忆不影响回顾 */
export interface ArchivedMemory {
  id: string;
  location: string;
  smell_type: SmellType;
  intensity: number;
}

export interface MonthlyReview {
  /** 归档月份，格式 YYYY-MM */
  month: string;
  /** 保存时间 ISO */
  savedAt: string;
  count: number;
  avgIntensity: number;
  topType: SmellType | null;
  topTypeCount: number;
  wantAgainCount: number;
  memories: ArchivedMemory[];
}

/** 取某个日期对应的月份键（本地时区），不传则取当前月 */
export function getMonthKey(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** '2026-09' -> '2026年9月' */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${y}年${Number(m)}月`;
}

/**
 * 基于「当前看到的记忆」（即已应用筛选的列表）生成当月回顾快照。
 * 快照在保存瞬间定型，与之后的记忆增删改完全脱钩。
 */
export function buildReview(month: string, memories: SmellMemory[]): MonthlyReview {
  const counts = new Map<SmellType, number>();
  for (const m of memories) {
    counts.set(m.smell_type, (counts.get(m.smell_type) ?? 0) + 1);
  }

  // 并列时按气味类型的固定顺序取第一个
  let topType: SmellType | null = null;
  let topTypeCount = 0;
  for (const t of SMELL_TYPES) {
    const c = counts.get(t.value) ?? 0;
    if (c > topTypeCount) {
      topType = t.value;
      topTypeCount = c;
    }
  }

  return {
    month,
    savedAt: new Date().toISOString(),
    count: memories.length,
    avgIntensity: getAverageIntensity(memories),
    topType: memories.length > 0 ? topType : null,
    topTypeCount,
    wantAgainCount: memories.filter((m) => m.want_again).length,
    memories: memories.map((m) => ({
      id: m.id,
      location: m.location,
      smell_type: m.smell_type,
      intensity: m.intensity,
    })),
  };
}

/** 月份键从近到远排序 */
export function sortReviewsDesc(reviews: MonthlyReview[]): MonthlyReview[] {
  return [...reviews].sort((a, b) => b.month.localeCompare(a.month));
}

export interface TypeCount {
  type: SmellType;
  count: number;
}

/** 回顾中各气味类型的条数分布，按条数降序（并列按固定类型顺序） */
export function getReviewTypeBreakdown(review: MonthlyReview): TypeCount[] {
  return SMELL_TYPES.map((t) => ({
    type: t.value,
    count: review.memories.filter((m) => m.smell_type === t.value).length,
  }))
    .filter((x) => x.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return SMELL_TYPES.findIndex((t) => t.value === a.type)
        - SMELL_TYPES.findIndex((t) => t.value === b.type);
    });
}

export interface LocationCount {
  location: string;
  smell_type: SmellType;
  count: number;
}

/** 回顾中去重后的参与地点（同地点多次出现时合并计数），保留首次出现顺序 */
export function getReviewLocations(review: MonthlyReview): LocationCount[] {
  const indexByLocation = new Map<string, number>();
  const result: LocationCount[] = [];
  for (const m of review.memories) {
    const idx = indexByLocation.get(m.location);
    if (idx === undefined) {
      indexByLocation.set(m.location, result.length);
      result.push({ location: m.location, smell_type: m.smell_type, count: 1 });
    } else {
      result[idx].count += 1;
    }
  }
  return result;
}
