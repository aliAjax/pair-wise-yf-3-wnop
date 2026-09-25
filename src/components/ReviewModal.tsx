import { useEffect, useMemo, useState } from 'react';
import { X, Archive, TriangleAlert, Heart, Gauge, ListChecks, Sparkles } from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import { getSmellTypeInfo } from '../utils/constants';
import type { MonthlyReview } from '../utils/review';
import {
  buildReview,
  formatMonthLabel,
  getMonthKey,
  getReviewLocations,
  getReviewTypeBreakdown,
} from '../utils/review';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 当前筛选结果 —— 归档只认「现在看到的这些记忆」 */
  filteredMemories: SmellMemory[];
  /** 全部记忆，用来生成快捷月份选项 */
  allMemories: SmellMemory[];
  reviews: MonthlyReview[];
  onSave: (month: string, memories: SmellMemory[]) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  filteredMemories,
  allMemories,
  reviews,
  onSave,
}: Props) {
  const [month, setMonth] = useState(getMonthKey());
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMonth(getMonthKey());
      setConfirmed(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // 快捷月份：记忆所属月份 + 已归档月份，去重后从近到远取 6 个
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    allMemories.forEach((m) => set.add(getMonthKey(m.created_at)));
    reviews.forEach((r) => set.add(r.month));
    set.add(getMonthKey());
    return [...set].sort((a, b) => b.localeCompare(a)).slice(0, 6);
  }, [allMemories, reviews]);

  // 基于当前筛选结果实时预览（保存瞬间才定型为快照）
  const preview = useMemo(
    () => buildReview(month, filteredMemories),
    [month, filteredMemories],
  );
  const locations = useMemo(() => getReviewLocations(preview), [preview]);
  const typeBreakdown = useMemo(() => getReviewTypeBreakdown(preview), [preview]);

  const oldReview = reviews.find((r) => r.month === month) ?? null;
  const isEmpty = filteredMemories.length === 0;
  const blocked = isEmpty || (!!oldReview && !confirmed);

  if (!isOpen) return null;

  const topTypeInfo = preview.topType ? getSmellTypeInfo(preview.topType) : null;
  const oldTopTypeInfo = oldReview?.topType ? getSmellTypeInfo(oldReview.topType) : null;

  const handleSave = () => {
    if (blocked) return;
    onSave(month, filteredMemories);
    onClose();
  };

  const statTiles = [
    {
      icon: <ListChecks className="w-4 h-4" />,
      label: '记忆条数',
      value: String(preview.count),
      unit: '条',
    },
    {
      icon: <Gauge className="w-4 h-4" />,
      label: '平均强度',
      value: preview.count ? preview.avgIntensity.toFixed(1) : '—',
      unit: '/ 10',
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: '最常见气味',
      value: topTypeInfo ? `${topTypeInfo.emoji} ${topTypeInfo.label}` : '—',
      unit: topTypeInfo ? `× ${preview.topTypeCount}` : '',
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: '想再闻',
      value: String(preview.wantAgainCount),
      unit: '条',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div className="relative w-full max-w-2xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
              <Archive className="w-6 h-6 text-ochre-500" />
              月度气味归档
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              把当前筛选看到的 {filteredMemories.length} 条记忆封存为当月回顾
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 选择归档月份 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-ochre-500 rounded-full" />
              <h3 className="font-hand text-xl text-ochre-600">归档到哪个月</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="month"
                value={month}
                max={getMonthKey()}
                onChange={(e) => { setMonth(e.target.value); setConfirmed(false); }}
                className="scent-input sm:w-48 font-medium cursor-pointer"
              />
              <div className="flex flex-wrap gap-2">
                {monthOptions.map((mk) => {
                  const archived = reviews.some((r) => r.month === mk);
                  const active = mk === month;
                  return (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => { setMonth(mk); setConfirmed(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        active
                          ? 'bg-ochre-500 text-paper-50 border-ochre-600 shadow-paper'
                          : archived
                            ? 'bg-lavender-300/30 text-lavender-600 border-lavender-300/60 hover:bg-lavender-300/50'
                            : 'bg-paper-100 text-ink-700 border-paper-200 hover:bg-paper-200'
                      }`}
                    >
                      {mk === getMonthKey() ? '本月' : formatMonthLabel(mk)}
                      {archived && <span className="ml-1">📜</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-ink-700/50">
              带 📜 的月份已有回顾；统计内容始终来自当前筛选结果，选择月份只决定它被归到哪一月。
            </p>
          </div>

          {/* 当前结果预览 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-moss-500 rounded-full" />
              <h3 className="font-hand text-xl text-moss-600">将封存的数字</h3>
            </div>

            {isEmpty ? (
              <div className="rounded-2xl border-2 border-dashed border-paper-400 bg-paper-100/50 py-10 text-center">
                <div className="text-4xl mb-2 select-none">🕯️</div>
                <p className="text-sm text-ink-700/70">当前筛选下没有记忆，无法归档</p>
                <p className="text-xs text-ink-700/50 mt-1">调整或清除筛选条件后再来封存吧</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {statTiles.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-paper-100/70 border border-paper-200 p-3.5 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] text-ink-700/60 mb-1.5">
                        {s.icon}
                        {s.label}
                      </div>
                      <div className="font-serif text-2xl font-bold text-ochre-600 leading-tight">
                        {s.value}
                      </div>
                      {s.unit && <div className="text-[10px] text-ink-700/50 mt-0.5">{s.unit}</div>}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-paper-100/60 border border-paper-200 p-4 space-y-3">
                  <div>
                    <div className="text-xs text-ink-700/60 mb-1.5">
                      参与地点 · {locations.length} 处
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {locations.map((loc) => {
                        const info = getSmellTypeInfo(loc.smell_type);
                        return (
                          <span
                            key={loc.location}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-paper-50 border border-paper-300 text-ink-800"
                          >
                            <span>{info.emoji}</span>
                            <span className="max-w-[10rem] truncate">{loc.location}</span>
                            {loc.count > 1 && (
                              <span className="text-ink-700/50">×{loc.count}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-700/60 mb-1.5">
                      气味类型 · {typeBreakdown.length} 种
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {typeBreakdown.map(({ type, count }) => {
                        const info = getSmellTypeInfo(type);
                        return (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-paper-50"
                            style={{ backgroundColor: info.color }}
                          >
                            <span>{info.emoji}</span>
                            {info.label}
                            <span className="opacity-80">×{count}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 同月已有回顾：先亮旧数字 */}
          {oldReview && (
            <div className="rounded-2xl border-2 border-brick-400/50 bg-brick-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-brick-600">
                <TriangleAlert className="w-4 h-4" />
                <span className="font-hand text-lg">
                  {formatMonthLabel(month)}已有一份回顾
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { label: '旧条数', value: `${oldReview.count} 条` },
                  { label: '旧平均强度', value: oldReview.count ? `${oldReview.avgIntensity.toFixed(1)} / 10` : '—' },
                  {
                    label: '旧最常见气味',
                    value: oldTopTypeInfo
                      ? `${oldTopTypeInfo.emoji} ${oldTopTypeInfo.label} × ${oldReview.topTypeCount}`
                      : '—',
                  },
                  { label: '旧想再闻', value: `${oldReview.wantAgainCount} 条` },
                ].map((x) => (
                  <div key={x.label} className="rounded-xl bg-paper-50/80 border border-brick-400/30 px-3 py-2 text-center">
                    <div className="text-[10px] text-ink-700/55">{x.label}</div>
                    <div className="text-sm font-semibold text-ink-800 mt-0.5">{x.value}</div>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brick-500 cursor-pointer"
                />
                <span className="text-sm text-ink-700">
                  我已对比旧数字，确认用当前结果覆盖 {formatMonthLabel(month)} 的回顾
                </span>
              </label>
            </div>
          )}

          <p className="text-[11px] text-ink-700/45 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" />
            保存后即为独立快照，之后编辑或清理这些记忆都不会改写本次结果。
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={blocked}
              className={`btn-primary ${blocked ? 'opacity-40 cursor-not-allowed hover:translate-y-0' : ''}`}
            >
              {oldReview ? '确认覆盖并归档' : `封存为${month === getMonthKey() ? '当月' : formatMonthLabel(month)}回顾`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
