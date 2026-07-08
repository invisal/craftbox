import type { JSX } from 'react';
import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ExportSegment } from '@screen-studio/types/export';
import { useExportStore } from '../store/export-store';
import { estimateExportSize } from '../engine/estimate-size';
import { buildExportProject } from '../lib/build-export-project';
import {
  CODEC_OPTIONS,
  EXPORT_PRESETS,
  FORMAT_OPTIONS,
  FRAME_RATE_OPTIONS,
  RESOLUTION_OPTIONS,
  qualityLabel
} from '../presets';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ExportSidePanelProps {
  originalSizeBytes: number;
  durationSeconds: number;
  sourceVideoPath: string | null;
  segments: ExportSegment[];
}

export function ExportSidePanel({
  originalSizeBytes,
  durationSeconds,
  sourceVideoPath,
  segments
}: ExportSidePanelProps): JSX.Element {
  const store = useExportStore();

  const estimate = estimateExportSize({
    originalSizeBytes,
    durationSeconds,
    resolution: store.resolution,
    frameRate: store.frameRate,
    codec: store.codec,
    quality: store.quality
  });

  return (
    <aside className="flex w-[360px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-line bg-surface-sunken p-5">
      {/* Estimated output */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">
            Estimated output
          </span>
          {estimate.reductionPercent > 0 && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              −{estimate.reductionPercent}%
            </span>
          )}
        </div>

        <div>
          <p className="font-mono text-3xl font-bold">{formatMb(estimate.estimatedBytes)}</p>
          <p className="text-xs text-white/40">
            from {formatMb(originalSizeBytes)} · {Math.round(durationSeconds)}s
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.max(4, 100 - estimate.reductionPercent)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Bitrate" value={`${estimate.bitrateMbps.toFixed(1)} Mbps`} />
          <Stat label="Frame" value={`${store.resolution.width}×${store.resolution.height}`} />
          <Stat label="Rate" value={`${store.frameRate} fps`} />
        </div>
      </section>

      {/* Presets */}
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-white/40">Presets</span>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_PRESETS.map((preset) => {
            const isSelected = store.presetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => store.setPreset(preset.id)}
                className={cn(
                  'relative rounded-xl border p-3 text-left transition-colors',
                  isSelected ? 'border-accent bg-accent/10' : 'border-line hover:border-white/20'
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-surface">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <p className="text-sm font-medium">{preset.label}</p>
                <p className="text-xs text-white/40">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Format */}
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-white/40">Format</span>
        <div className="grid grid-cols-4 gap-2">
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => store.setFormat(option.id)}
              className={cn(
                'rounded-lg border py-1.5 text-sm font-medium transition-colors',
                store.format === option.id
                  ? 'border-accent text-accent'
                  : 'border-line text-white/60 hover:border-white/20'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Codec */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">Codec</span>
          <span className="text-xs text-white/30">smaller →</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CODEC_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => store.setCodec(option.id)}
              className={cn(
                'rounded-lg border py-2 text-center transition-colors',
                store.codec === option.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-white/70 hover:border-white/20'
              )}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-[11px] opacity-70">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Quality */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">Quality</span>
          <span className="text-xs font-medium text-accent">
            {qualityLabel(store.quality)} {store.quality}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={store.quality}
          onChange={(e) => store.setQuality(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-white/30">
          <span>Draft</span>
          <span>Balanced</span>
          <span>High</span>
          <span>Lossless</span>
        </div>
      </section>

      {/* Resolution / Frame rate */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">
            Resolution
          </span>
          <select
            value={`${store.resolution.width}x${store.resolution.height}`}
            onChange={(e) => {
              const [width, height] = e.target.value.split('x').map(Number);
              store.setResolution({ width, height });
            }}
            className="rounded-lg border border-line bg-surface-raised px-2 py-1.5 text-sm"
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <option key={option.label} value={`${option.width}x${option.height}`}>
                {option.label} {option.width}×{option.height}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-white/40">
            Frame rate
          </span>
          <select
            value={store.frameRate}
            onChange={(e) => store.setFrameRate(Number(e.target.value))}
            className="rounded-lg border border-line bg-surface-raised px-2 py-1.5 text-sm"
          >
            {FRAME_RATE_OPTIONS.map((fps) => (
              <option key={fps} value={fps}>
                {fps} fps
              </option>
            ))}
          </select>
        </div>
      </section>

      <ExportAction sourceVideoPath={sourceVideoPath} segments={segments} />
    </aside>
  );
}

function ExportAction({
  sourceVideoPath,
  segments
}: {
  sourceVideoPath: string | null;
  segments: ExportSegment[];
}): JSX.Element {
  const store = useExportStore();
  const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ percent: number; stage: string } | null>(null);

  async function handleExport(): Promise<void> {
    if (!sourceVideoPath) {
      setStatus('error');
      setError('Recording is still being saved. Try again in a moment.');
      return;
    }
    if (segments.length === 0 || segments.some((s) => s.range.endMs <= s.range.startMs)) {
      setStatus('error');
      setError('Nothing to export -- cut out every clip on the timeline.');
      return;
    }

    const outputPath = await window.screenStudio.dialog.showSaveExportPath(
      `export.${store.format}`,
      store.format
    );
    if (!outputPath) return;

    setStatus('exporting');
    setError(null);
    setProgress({ percent: 0, stage: 'rendering' });

    const unsubscribe = window.screenStudio.export.onProgress((p) => {
      setProgress({ percent: p.percent, stage: p.stage });
      if (p.stage === 'error' && p.error) setError(p.error);
    });

    try {
      const durationMs = segments.reduce((sum, s) => sum + (s.range.endMs - s.range.startMs), 0);
      await window.screenStudio.export.start({
        format: store.format,
        codec: store.codec,
        aspectRatio: store.aspectRatio,
        resolution: store.resolution,
        frameRate: store.frameRate,
        quality: store.quality,
        outputPath,
        sourceVideoPath,
        segments,
        project: buildExportProject(sourceVideoPath, durationMs)
      });
      setStatus('idle');
      setProgress(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      unsubscribe();
    }
  }

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
      {status === 'error' && error && <p className="text-xs text-red-400">{error}</p>}
      {status === 'exporting' && progress && (
        <p className="text-xs text-white/50">
          {progress.stage} · {progress.percent}%
        </p>
      )}
      <Button
        onClick={handleExport}
        disabled={status === 'exporting'}
        className="w-full justify-center"
      >
        {status === 'exporting' ? 'Exporting…' : 'Export'}
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-white/30">{label}</p>
      <p className="font-mono text-xs text-white/80">{value}</p>
    </div>
  );
}
