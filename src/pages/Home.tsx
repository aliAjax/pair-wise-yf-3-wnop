import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import FilterPanel from '../components/FilterPanel';
import VisualizationPanel from '../components/VisualizationPanel';
import MonthlyReviews from '../components/MonthlyReviews';
import ReviewOverwriteModal from '../components/ReviewOverwriteModal';
import MemoryCard from '../components/MemoryCard';
import MemoryModal from '../components/MemoryModal';
import { useMemoryStore } from '../store/memoryStore';
import type { Filters } from '../utils/helpers';
import { filterMemories } from '../utils/helpers';
import type { SmellMemory } from '../utils/constants';
import type { MemoryInput } from '../store/memoryStore';
import type { MonthlyReview } from '../utils/review';
import { formatMonth } from '../utils/review';
import { BookOpenCheck, CheckCircle2 } from 'lucide-react';

const defaultFilters: Filters = {
  smellType: '',
  season: '',
  emotion: '',
};

export default function Home() {
  const { memories, reviews, initIfEmpty, addMemory, updateMemory, deleteMemory, saveMonthlyReview } = useMemoryStore();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmellMemory | null>(null);
  const [pendingReview, setPendingReview] = useState<MonthlyReview | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    initIfEmpty();
  }, [initIfEmpty]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredMemories = useMemo(
    () => filterMemories(memories, filters),
    [memories, filters],
  );

  const hasFilter = !!(filters.smellType || filters.season || filters.emotion);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const resetFilters = () => setFilters(defaultFilters);

  const openAddModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (m: SmellMemory) => { setEditing(m); setModalOpen(true); };

  const handleSubmit = (data: MemoryInput) => {
    if (editing) {
      updateMemory(editing.id, data);
    } else {
      addMemory(data);
    }
  };

  const handleDelete = (id: string) => {
    const target = memories.find((m) => m.id === id);
    const msg = `确认删除「${target?.location ?? '这段记忆'}」吗？`;
    if (window.confirm(msg)) {
      deleteMemory(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const scrollToCard = (id: string) => {
    setExpandedId(id);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-memory-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleSaved = (review: MonthlyReview, overwritten: boolean) => {
    setToast(
      overwritten
        ? `已用当前结果更新 ${formatMonth(review.month)} 回顾`
        : `已封存 ${formatMonth(review.month)} 回顾`,
    );
  };

  const handleConfirmOverwrite = () => {
    if (!pendingReview) return;
    // 覆盖数字但保留首次归档时间，方便辨认这份回顾的来历
    const old = reviews.find((r) => r.month === pendingReview.month);
    const merged: MonthlyReview = old
      ? { ...pendingReview, created_at: old.created_at }
      : pendingReview;
    saveMonthlyReview(merged);
    setPendingReview(null);
    handleSaved(merged, !!old);
  };

  const oldReviewForModal = pendingReview
    ? reviews.find((r) => r.month === pendingReview.month) ?? null
    : null;

  return (
    <div className="min-h-screen">
      <Header onAdd={openAddModal} memoryCount={memories.length} />

      <main className="container max-w-6xl pb-20">
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          resultCount={filteredMemories.length}
        />

        <VisualizationPanel memories={filteredMemories} onSelect={scrollToCard} />

        <MonthlyReviews
          filteredMemories={filteredMemories}
          hasFilter={hasFilter}
          reviews={reviews}
          onSave={saveMonthlyReview}
          onSaved={handleSaved}
          onRequestOverwrite={setPendingReview}
        />

        <section className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-hand text-2xl text-ochre-600 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5" />
              气味档案
            </h2>
            <span className="text-xs text-ink-700/50">
              点击卡片展开完整回忆
            </span>
          </div>

          {filteredMemories.length === 0 ? (
            <div className="bg-paper-50/70 backdrop-blur rounded-3xl border-2 border-dashed border-paper-400 py-20 text-center">
              <div className="text-6xl mb-4 select-none">🍂</div>
              <h3 className="font-serif text-2xl text-ink-800 mb-2">
                {hasFilter
                  ? '没有匹配的气味记忆'
                  : '还没有封存任何气味'}
              </h3>
              <p className="text-ink-700/60 max-w-md mx-auto mb-6">
                {hasFilter
                  ? '换一组筛选条件试试？或者先封存一段新的气味'
                  : '空气中一定有让你难忘的味道——无论是衣柜里的樟木香，还是雨后操场的青草气'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={openAddModal} className="btn-primary">
                  封存第一段气味
                </button>
                {hasFilter && (
                  <button onClick={resetFilters} className="btn-secondary">
                    清除筛选条件
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="masonry-grid">
              {filteredMemories.map((m, idx) => (
                <div key={m.id} data-memory-id={m.id}>
                  <MemoryCard
                    memory={m}
                    index={idx}
                    isExpanded={expandedId === m.id}
                    onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    onEdit={() => openEditModal(m)}
                    onDelete={() => handleDelete(m.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="pb-10 pt-4 text-center text-xs text-ink-700/40 font-hand text-lg">
        <p>愿每一缕气味，都是打开旧时光的钥匙 · Scent Archive</p>
      </footer>

      <MemoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editingData={editing}
      />

      <ReviewOverwriteModal
        isOpen={!!pendingReview}
        oldReview={oldReviewForModal}
        newReview={pendingReview}
        onCancel={() => setPendingReview(null)}
        onConfirm={handleConfirmOverwrite}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fadeInUp pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-moss-500 text-paper-50 text-sm font-medium shadow-paper-hover">
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
