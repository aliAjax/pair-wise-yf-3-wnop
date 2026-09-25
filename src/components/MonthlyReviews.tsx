import { useState } from 'react';
import {
  Archive,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Gauge,
  Sparkles,
  Heart,
  MapPin,
  Plus,
} from 'lucide-react';
import type { MonthlyReview } from '../utils/review';
import {
  formatMonthLabel,
  getMonthKey,
  getReviewLocations,
  getReviewTypeBreakdown,
  sortReviewsDesc,
} from '../utils/review';
import { getSmellTypeInfo } from '../utils/constants';
import { formatDate } from '../utils/helpers';

interface Props {
  reviews: MonthlyReview[];
  resultCount: number;
  onArchive: () => void;
}

export default function MonthlyReviews({ reviews, resultCount, onArchive }: Props) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const sorted = sortReviewsDesc(reviews);

  return (
    <section className="container max-w-6xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-hand text-2xl text-ochre-600 flex items-center gap-2">
          <Archive className="w-5 h-5" />
          月度归档
        </h2>
        <button
          onClick={onArchive}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-ochre-100 text-ochre-600 hover:bg-ochre-200/70 border border-ochre-200/60 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          归档当前结果（{resultCount} 条）
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-12 px-6 text-center">
          <div className="text-5xl mb-3 select-none">🗄️</div>
          <h3 className="font-serif text-xl text-ink-800 mb-2">还没有月度回顾</h3>
          <p className="text-ink-700/60 text-sm max-w-md mx-auto mb-5">
            筛选结果只会呈现当下，几个月前的构成会慢慢找不到。把此刻看到的气味封存成当月回顾，日后随时可以翻阅。
          </p>
          <button onClick={onArchive} className="btn-primary">
            封存第一份月度回顾
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((review, idx) => {
            const isOpen = expandedMonth === review.month;
            const topTypeInfo = review.topType ? getSmellTypeInfo(review.topType) : null;
            const locations = getReviewLocations(review);
            const types = getReviewTypeBreakdown(review);
            const isCurrentMonth = review.month === getMonthKey();

            return (
              <article
                key={review.month}
                className="bg-paper-50/80 backdrop-blur rounded-2xl border border-paper-300 shadow-card overflow-hidden animate-fadeInUp"
                style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
              >
                <button
                  onClick={() => setExpandedMonth(isOpen ? null : review.month)}
                  className="w-full text-left p-4 md:p-5 flex items-center gap-4 hover:bg-paper-100/50 transition-colors"
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-ochre-500/10 border border-ochre-200/50 flex flex-col items-center justify-center text-ochre-600">
                    <span className="font-serif text-lg font-bold leading-none">
                      {Number(review.month.split('-')[1])}
                    </span>
                    <span className="text-[10px] mt-0.5">{review.month.split('-')[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg font-semibold text-ink-800">
                        {formatMonthLabel(review.month)}
                      </h3>
                      {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded-full bg-moss-100 text-moss-600 text-[10px] font-medium">
                          本月
                        </span>
                      )}
                      <span className="text-[10px] text-ink-700/45">
                        封存于 {formatDate(review.savedAt)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-700/70">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5 text-ochre-500" />
                        {review.count} 条
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-ochre-500" />
                        平均 {review.count ? review.avgIntensity.toFixed(1) : '—'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: topTypeInfo?.color }} />
                        {topTypeInfo ? `${topTypeInfo.emoji} ${topTypeInfo.label} × ${review.topTypeCount}` : '—'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-brick-500">
                        <Heart className="w-3.5 h-3.5" />
                        想再闻 {review.wantAgainCount}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-ochre-600 font-medium">
                    {isOpen ? (
                      <><ChevronUp className="w-4 h-4" /> 收起</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> 详情</>
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 animate-expand">
                    <div className="pt-3 border-t border-paper-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-paper-100/60 border border-paper-200/80 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ochre-600 mb-2.5">
                          <MapPin className="w-3.5 h-3.5" />
                          参与地点 · {locations.length} 处
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {locations.length === 0 ? (
                            <span className="text-xs text-ink-700/45">无</span>
                          ) : (
                            locations.map((loc) => {
                              const info = getSmellTypeInfo(loc.smell_type);
                              return (
                                <span
                                  key={loc.location}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-paper-50 border border-paper-300 text-ink-800"
                                >
                                  <span>{info.emoji}</span>
                                  <span className="max-w-[12rem] truncate">{loc.location}</span>
                                  {loc.count > 1 && <span className="text-ink-700/50">×{loc.count}</span>}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-paper-100/60 border border-paper-200/80 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ochre-600 mb-2.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          参与类型 · {types.length} 种
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {types.length === 0 ? (
                            <span className="text-xs text-ink-700/45">无</span>
                          ) : (
                            types.map(({ type, count }) => {
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
                            })
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[11px] text-ink-700/45">
                      以上为 {formatDate(review.savedAt)} 封存时的快照，不受之后的记忆编辑或清理影响。
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
