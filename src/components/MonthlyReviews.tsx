import { useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Heart,
  MapPin,
  Gauge,
  Tags,
} from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import { getSmellTypeInfo } from '../utils/constants';
import type { MonthlyReview } from '../utils/review';
import { buildMonthlyReview, formatMonth, getMonthKey, sortReviewsDesc } from '../utils/review';

interface Props {
  /** 当前筛选结果——只归档此刻能看到的记忆 */
  filteredMemories: SmellMemory[];
  /** 当前是否有筛选条件生效 */
  hasFilter: boolean;
  reviews: MonthlyReview[];
  onSave: (review: MonthlyReview) => void;
  /** 保存成功后通知父层弹提示 */
  onSaved: (review: MonthlyReview, overwritten: boolean) => void;
  /** 同月已有归档时触发：父组件先展示旧数字，等用户确认后再调用 onSave */
  onRequestOverwrite: (newReview: MonthlyReview) => void;
}

function monthShortLabel(month: string): string {
  return formatMonth(month).replace(/^\d+ 年 /, '');
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-paper-100/70 border border-paper-200/80 px-3 py-2.5">
      <span className="text-ochre-500">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-ink-700/55 leading-none">{label}</div>
        <div className="text-base font-serif font-semibold text-ink-800 mt-1 leading-none">{value}</div>
      </div>
    </div>
  );
}

function ReviewCard({ review, defaultOpen }: { review: MonthlyReview; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const topType = review.top_type ? getSmellTypeInfo(review.top_type) : null;

  return (
    <article className="bg-paper-50 rounded-2xl border border-paper-300 shadow-card overflow-hidden transition-shadow hover:shadow-paper-hover">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="w-10 h-10 shrink-0 rounded-xl bg-ochre-100 text-ochre-600 flex items-center justify-center">
          <Archive className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold text-ink-800 leading-tight">
            {formatMonth(review.month)}
          </h3>
          <p className="text-xs text-ink-700/55 mt-0.5">
            {review.memory_count} 段气味 · 平均 {review.avg_intensity.toFixed(1)}
            {topType ? ` · 最常 ${topType.emoji}${topType.label}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-ink-700/40">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-expand overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Stat
              icon={<ArchiveRestore className="w-4 h-4" />}
              label="记忆条数"
              value={`${review.memory_count} 条`}
            />
            <Stat
              icon={<Gauge className="w-4 h-4" />}
              label="平均强度"
              value={review.avg_intensity.toFixed(1)}
            />
            <Stat
              icon={<Tags className="w-4 h-4" />}
              label="最常见气味"
              value={topType ? `${topType.emoji} ${topType.label}` : '—'}
            />
            <Stat
              icon={<Heart className="w-4 h-4" />}
              label="想再闻"
              value={`${review.want_again_count} 条`}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-paper-100/60 border border-paper-200/70 p-3">
              <h4 className="inline-flex items-center gap-1.5 text-sm font-hand text-ochre-600 mb-2">
                <MapPin className="w-4 h-4" /> 参与归档的地点
              </h4>
              {review.locations.length === 0 ? (
                <p className="text-xs text-ink-700/45">本月归档时没有可见记忆</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {review.locations.map((loc) => (
                    <span
                      key={loc.name}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper-50 border border-paper-300 text-xs text-ink-700"
                    >
                      <span className="max-w-[10rem] truncate">{loc.name}</span>
                      {loc.count > 1 && (
                        <span className="text-ochre-600 font-semibold">×{loc.count}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-paper-100/60 border border-paper-200/70 p-3">
              <h4 className="inline-flex items-center gap-1.5 text-sm font-hand text-ochre-600 mb-2">
                <Tags className="w-4 h-4" /> 气味类型
              </h4>
              {review.types.length === 0 ? (
                <p className="text-xs text-ink-700/45">本月归档时没有可见记忆</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {review.types.map((t) => {
                    const info = getSmellTypeInfo(t.type);
                    return (
                      <span
                        key={t.type}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-paper-50 text-xs"
                        style={{ backgroundColor: info.color }}
                      >
                        <span>{info.emoji}</span>
                        <span>{info.label}</span>
                        <span className="opacity-80 font-semibold">×{t.count}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-ink-700/45">
            归档于 {new Date(review.saved_at).toLocaleString('zh-CN', { hour12: false })}
            {review.saved_at !== review.created_at && '（已更新过一次）'}
          </p>
        </div>
      )}
    </article>
  );
}

export default function MonthlyReviews({ filteredMemories, hasFilter, reviews, onSave, onSaved, onRequestOverwrite }: Props) {
  const [justSavedMonth, setJustSavedMonth] = useState<string | null>(null);

  const sorted = useMemo(() => sortReviewsDesc(reviews), [reviews]);
  const currentMonth = getMonthKey();
  const existing = reviews.find((r) => r.month === currentMonth) ?? null;

  const handleSaveRequest = () => {
    const snapshot = buildMonthlyReview(filteredMemories, currentMonth);
    if (existing) {
      // 同月再存：先让父组件亮出旧数字，由用户确认后才真正覆盖
      onRequestOverwrite(snapshot);
    } else {
      onSave(snapshot);
      setJustSavedMonth(currentMonth);
      onSaved(snapshot, false);
    }
  };

  return (
    <section className="container max-w-6xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-hand text-2xl text-ochre-600">月度归档</span>
          <span className="text-xs text-ink-700/50">
            · 基于当前看到的 {filteredMemories.length} 段记忆
            {hasFilter && '（已筛选）'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSaveRequest}
          disabled={filteredMemories.length === 0}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            filteredMemories.length === 0
              ? 'bg-paper-200/60 text-ink-700/40 cursor-not-allowed'
              : 'bg-ochre-500 hover:bg-ochre-600 text-paper-50 shadow-paper hover:-translate-y-0.5'
          }`}
          title={
            filteredMemories.length === 0
              ? '当前筛选结果没有记忆，无法归档'
              : existing
                ? `${formatMonth(currentMonth)}已有归档，再存会先展示旧数字`
                : '把当前筛选结果存为当月回顾'
          }
        >
          <Archive className="w-4 h-4" />
          {existing ? `更新${monthShortLabel(currentMonth)}回顾` : `存为${monthShortLabel(currentMonth)}回顾`}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-paper-50/70 backdrop-blur rounded-2xl border-2 border-dashed border-paper-400 py-12 px-6 text-center">
          <div className="text-5xl mb-3 select-none">🗂️</div>
          <h3 className="font-serif text-xl text-ink-800 mb-1">还没有任何月度回顾</h3>
          <p className="text-sm text-ink-700/60">
            气味档案只显示当前筛选结果，几个月前的构成会随记忆的编辑与清理而消失。
            <br className="hidden sm:block" />
            先调好筛选，再点击右上角「存为当月回顾」，把此刻的数字封存下来。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((review) => (
            <ReviewCard
              key={review.month}
              review={review}
              defaultOpen={review.month === justSavedMonth}
            />
          ))}
        </div>
      )}
    </section>
  );
}
