import { useEffect } from 'react';
import { X, History, Sparkles } from 'lucide-react';
import type { MonthlyReview } from '../utils/review';
import { formatMonth } from '../utils/review';
import { getSmellTypeInfo } from '../utils/constants';

interface Props {
  isOpen: boolean;
  oldReview: MonthlyReview | null;
  newReview: MonthlyReview | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function typeLabel(review: MonthlyReview): string {
  if (!review.top_type) return '—';
  const info = getSmellTypeInfo(review.top_type);
  return `${info.emoji} ${info.label}`;
}

function StatRow({ label, oldValue, newValue, highlight }: {
  label: string;
  oldValue: string | number;
  newValue: string | number;
  highlight?: boolean;
}) {
  const changed = String(oldValue) !== String(newValue);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-paper-200/70 last:border-b-0">
      <span className="flex-1 text-sm text-ink-700/70">{label}</span>
      <span className="px-3 py-1 rounded-lg bg-paper-100 text-ink-700/70 text-sm font-medium min-w-[72px] text-center">
        {oldValue}
      </span>
      <span className="text-ink-700/40 text-xs">→</span>
      <span
        className={`px-3 py-1 rounded-lg text-sm font-semibold min-w-[72px] text-center ${
          highlight && changed
            ? 'bg-ochre-100 text-ochre-600'
            : 'bg-moss-100 text-moss-600'
        }`}
      >
        {newValue}
      </span>
    </div>
  );
}

export default function ReviewOverwriteModal({ isOpen, oldReview, newReview, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen || !oldReview || !newReview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div className="relative w-full max-w-lg bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800">
              {formatMonth(oldReview.month)}已有归档
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              再存一次会覆盖当时保存的数字，先看看变化吧
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-6 px-3 pb-2 text-xs font-medium text-ink-700/50">
            <span className="flex-1">统计项</span>
            <span className="inline-flex items-center gap-1 min-w-[72px] justify-center">
              <History className="w-3.5 h-3.5" /> 旧数字
            </span>
            <span className="w-4" />
            <span className="inline-flex items-center gap-1 min-w-[72px] justify-center">
              <Sparkles className="w-3.5 h-3.5" /> 本次
            </span>
          </div>
          <div className="px-3">
            <StatRow label="记忆条数" oldValue={`${oldReview.memory_count} 条`} newValue={`${newReview.memory_count} 条`} highlight />
            <StatRow label="平均强度" oldValue={oldReview.avg_intensity.toFixed(1)} newValue={newReview.avg_intensity.toFixed(1)} />
            <StatRow label="最常见气味" oldValue={typeLabel(oldReview)} newValue={typeLabel(newReview)} />
            <StatRow label="想再闻" oldValue={`${oldReview.want_again_count} 条`} newValue={`${newReview.want_again_count} 条`} />
          </div>
          <p className="mt-4 text-xs text-ink-700/50 leading-relaxed px-3">
            覆盖后，旧数字将无法找回；已归档的地点与气味类型也会替换为当前筛选结果。
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-paper-200">
          <button type="button" onClick={onCancel} className="btn-secondary">
            保留旧归档
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary"
          >
            用当前结果覆盖
          </button>
        </div>
      </div>
    </div>
  );
}
