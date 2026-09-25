import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion } from '../utils/constants';
import { generateId } from '../utils/helpers';
import type { MonthlyReview } from '../utils/review';
import { mockMemories } from '../data/mockData';

export interface MemoryInput {
  location: string;
  source_guess: string;
  intensity: number;
  humidity: number;
  season: Season;
  smell_type: SmellType;
  memory_text: string;
  color_association: string;
  emotion: Emotion;
  want_again: boolean;
}

interface MemoryStore {
  memories: SmellMemory[];
  reviews: MonthlyReview[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  deleteMemory: (id: string) => void;
  /**
   * 保存（或覆盖）某个月的归档回顾。
   * 回顾数据在传入前已按当时筛选结果计算成快照，
   * 这里只负责按月存放，不引用任何记忆本体。
   */
  saveMonthlyReview: (review: MonthlyReview) => void;
  initIfEmpty: () => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      reviews: [],
      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          created_at: now,
          updated_at: now,
        };
        set({ memories: [newMem, ...get().memories] });
      },
      updateMemory: (id, input) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? { ...m, ...input, updated_at: new Date().toISOString() }
              : m,
          ),
        });
      },
      deleteMemory: (id) => {
        set({ memories: get().memories.filter((m) => m.id !== id) });
      },
      saveMonthlyReview: (review) => {
        const others = get().reviews.filter((r) => r.month !== review.month);
        set({ reviews: [...others, review] });
      },
      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      storage: createJSONStorage(() => localStorage),
      // 旧版本本地存档没有 reviews 字段时，显式补空数组，保证旧档案也能继续记录
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<MemoryStore>;
        return {
          ...current,
          ...saved,
          reviews: Array.isArray(saved.reviews) ? saved.reviews : [],
        };
      },
    },
  ),
);
