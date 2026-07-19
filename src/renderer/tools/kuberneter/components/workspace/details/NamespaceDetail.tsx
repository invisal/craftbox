import { Age } from '../../Age';
import type React from 'react';
import { useState, useMemo } from 'react';
import { type NamespaceData } from '../../../types/NamespaceData';
import { KubePropertiesTable, type PropertyItem } from './KubePropertiesTable';
import { Cpu, Layers, ArrowUpDown, Database, Flag, MoreVertical } from 'lucide-react';

interface NamespaceDetailProps {
  payload: NamespaceData;
  isTab?: boolean;
}

export const NamespaceDetail: React.FC<NamespaceDetailProps> = ({ payload, isTab = false }) => {
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'network' | 'disk'>(
    'cpu'
  );
  const [timeRange, setTimeRange] = useState('1h');

  // Generate mock chart bar heights based on selected metric
  const mockBars = useMemo(() => {
    const count = 48;
    const bars: number[] = [];
    let base = 2.0;
    if (selectedMetric === 'memory') base = 3.2;
    if (selectedMetric === 'network') base = 1.5;
    if (selectedMetric === 'disk') base = 0.8;

    for (let i = 0; i < count; i++) {
      // Create some realistic looking noise/waves
      const wave = Math.sin(i / 3) * 0.4 + Math.sin(i / 1.5) * 0.2;
      const pseudoRandomVal = Math.sin(i * 12.9898) * 43758.5453;
      const noise = (pseudoRandomVal - Math.floor(pseudoRandomVal)) * 0.3 - 0.15;
      const val = Math.max(0.1, Math.min(4.0, base + wave + noise));
      bars.push(val);
    }
    return bars;
  }, [selectedMetric]);

  if (!payload) {
    return <div className="p-4 text-xs text-zinc-500">No Namespace details available.</div>;
  }

  const annotations = payload.annotations ? Object.entries(payload.annotations) : [];
  const labels = payload.labels ? Object.entries(payload.labels) : [];

  const propertiesData: PropertyItem[] = [
    {
      id: 'created',
      name: 'Created',
      value: (
        <span>
          <Age
            timestamp={(payload as unknown as Record<string, unknown>).creationTimestamp as string}
          />{' '}
          ago ({((payload as unknown as Record<string, unknown>).createdTime as string) || 'N/A'})
        </span>
      )
    },
    {
      id: 'name',
      name: 'Name',
      value: payload.name
    },
    {
      id: 'labels',
      name: 'Labels',
      value: `${labels.length} Labels`,
      hasDetail: labels.length > 0,
      renderDetail: () => (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1 select-text">
          {labels.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 border border-border/60 text-zinc-350 truncate max-w-full"
              title={`${k}=${v}`}
            >
              {k}={v}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'annotations',
      name: 'Annotations',
      value: `${annotations.length} Annotations`,
      hasDetail: annotations.length > 0,
      renderDetail: () => (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1 select-text">
          {annotations.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 border border-border/60 text-zinc-350 truncate max-w-full"
              title={`${k}=${v}`}
            >
              {k}={v}
            </span>
          ))}
        </div>
      )
    },
    {
      id: 'status',
      name: 'Status',
      value: (
        <span
          className={
            payload.status === 'Active'
              ? 'text-emerald-500 font-semibold'
              : 'text-red-500 font-semibold'
          }
        >
          {payload.status}
        </span>
      )
    }
  ];

  const metricLabel = {
    cpu: 'CPU Usage',
    memory: 'Memory Usage',
    network: 'Network Traffic',
    disk: 'Disk I/O'
  }[selectedMetric];

  return (
    <div className={`flex flex-col gap-4 ${isTab ? 'p-6 h-full overflow-y-auto' : 'flex-1'}`}>
      {/* Metrics Section */}
      <div className="flex flex-col bg-surface-2/40 border border-border/40 rounded-lg p-3 select-none">
        {/* Toolbar Header */}
        <div className="flex justify-between items-center pb-2 border-b border-border/40 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
              Metrics
            </span>
            <MoreVertical className="size-3.5 text-zinc-600" />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Time range selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-surface-3 border border-border/60 rounded text-[10px] px-1 py-0.5 text-zinc-300 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="1h">1h</option>
              <option value="6h">6h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
            </select>

            <span className="h-4 w-px bg-border/40 mx-1" />

            {/* Metric buttons */}
            <button
              onClick={() => setSelectedMetric('cpu')}
              title="CPU"
              className={`p-1 rounded cursor-pointer border-none bg-transparent transition-colors ${
                selectedMetric === 'cpu'
                  ? 'bg-accent/20 text-accent'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Cpu className="size-3.5" />
            </button>
            <button
              onClick={() => setSelectedMetric('memory')}
              title="Memory"
              className={`p-1 rounded cursor-pointer border-none bg-transparent transition-colors ${
                selectedMetric === 'memory'
                  ? 'bg-accent/20 text-accent'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers className="size-3.5" />
            </button>
            <button
              onClick={() => setSelectedMetric('network')}
              title="Network"
              className={`p-1 rounded cursor-pointer border-none bg-transparent transition-colors ${
                selectedMetric === 'network'
                  ? 'bg-accent/20 text-accent'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ArrowUpDown className="size-3.5" />
            </button>
            <button
              onClick={() => setSelectedMetric('disk')}
              title="Disk"
              className={`p-1 rounded cursor-pointer border-none bg-transparent transition-colors ${
                selectedMetric === 'disk'
                  ? 'bg-accent/20 text-accent'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Database className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-border/40 mx-1" />

            <button
              title="Filter"
              className="p-1 rounded cursor-pointer border-none bg-transparent text-zinc-555"
            >
              <Flag className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="text-[10px] text-zinc-500 mb-2 pl-0.5">
          Displaying metrics from Prometheus:{' '}
          <span className="text-accent/80 hover:underline cursor-pointer">lens-metrics</span> /{' '}
          <span className="text-accent/80 hover:underline cursor-pointer">prometheus:80</span>
        </div>

        {/* Bar Chart Area */}
        <div className="h-32 w-full bg-black/10 rounded border border-border-dark/30 relative flex flex-col justify-end p-2 pr-4">
          {/* Y Axis Labels */}
          <div className="absolute left-2 top-2 bottom-6 flex flex-col justify-between text-[8px] font-mono text-zinc-650">
            <span>4.000</span>
            <span>3.000</span>
            <span>2.000</span>
            <span>1.000</span>
            <span>0</span>
          </div>

          {/* Grid lines & Bars container */}
          <div className="ml-10 flex-1 relative border-b border-l border-zinc-800/60 flex items-end justify-between px-0.5">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-dashed border-zinc-500 h-0 w-full" />
              <div className="border-t border-dashed border-zinc-500 h-0 w-full" />
              <div className="border-t border-dashed border-zinc-500 h-0 w-full" />
              <div className="border-t border-dashed border-zinc-500 h-0 w-full" />
              <div className="border-t border-dashed border-zinc-500 h-0 w-full" />
            </div>

            {/* Render bars */}
            {mockBars.map((val, idx) => {
              const heightPercent = (val / 4.0) * 100;
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPercent}%` }}
                  className="w-[1.5%] bg-accent/30 border-t border-accent rounded-t-[1px]"
                  title={`${val.toFixed(3)}`}
                />
              );
            })}
          </div>

          {/* Timeline X Axis */}
          <div className="ml-10 mt-1.5 flex justify-between text-[8px] font-mono text-zinc-650">
            <span>11:29</span>
            <span>11:35</span>
            <span>11:41</span>
            <span>11:47</span>
            <span>11:53</span>
            <span>11:59</span>
            <span>12:05</span>
            <span>12:11</span>
            <span>12:17</span>
            <span>12:23</span>
          </div>
        </div>

        {/* Chart Legend Footer */}
        <div className="flex items-center gap-1.5 mt-2 pl-10">
          <div className="size-2 bg-accent rounded-[1px]" />
          <span className="text-[10px] text-zinc-400 font-medium">{metricLabel}</span>
        </div>
      </div>

      {/* Properties Section */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1">
          Properties
        </span>
        <KubePropertiesTable properties={propertiesData} />
      </div>

      {/* Events Section */}
      <div className="flex flex-col gap-1.5 mt-2 border-t border-border-dark/60 pt-3">
        <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Events</span>
        <div className="text-xs text-zinc-500 italic pl-1 mt-0.5">No events found</div>
      </div>
    </div>
  );
};
