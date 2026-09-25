import type { SmellMemory } from '../utils/constants';
import IntensityChart from './visualization/IntensityChart';
import AvgGauge from './visualization/AvgGauge';
import HumidityScatter from './visualization/HumidityScatter';
import TopList from './visualization/TopList';
import { Archive } from 'lucide-react';

interface Props {
  memories: SmellMemory[];
  onSelect: (id: string) => void;
  onArchive: () => void;
}

export default function VisualizationPanel({ memories, onSelect, onArchive }: Props) {
  if (memories.length === 0) return null;

  return (
    <section className="container max-w-6xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-hand text-2xl text-ochre-600">气味观测</span>
          <span className="text-xs text-ink-700/50">· 基于当前筛选结果</span>
        </div>
        <button
          onClick={onArchive}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ochre-100 text-ochre-600 hover:bg-ochre-200/70 border border-ochre-200/60 transition-all duration-200"
          title="把当前筛选结果封存为月度回顾"
        >
          <Archive className="w-3.5 h-3.5" />
          归档这组结果
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        <IntensityChart memories={memories} />
        <AvgGauge memories={memories} />
        <HumidityScatter memories={memories} />
        <TopList memories={memories} onSelect={onSelect} />
      </div>
    </section>
  );
}
