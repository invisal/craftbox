import type { JSX } from 'react';
import { Gauge } from 'lucide-react';
import { useTimelineStore } from '../store/timeline-store';
import { SegmentFlagTrack } from './SegmentFlagTrack';

/** Pill track for clips whose speed isn't 1x -- see SegmentFlagTrack.tsx. */
export function SpeedTrack(): JSX.Element | null {
  const setSegmentSpeed = useTimelineStore((s) => s.setSegmentSpeed);

  return (
    <SegmentFlagTrack
      hasFlag={(segment) => segment.speed !== 1}
      getTitle={(segment) => `${segment.speed}x -- drag to reorder`}
      colorClassName="border-amber-900/40 text-amber-950"
      renderContent={(segment) => (
        <>
          {/* Same two-layer gradient as ZoomTrack's pills (ZoomTrack.tsx) --
              a base color fill, then a light-at-bottom-fading-to-dark-at-top
              highlight on top, just amber instead of purple. */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-amber-400 via-amber-500 to-amber-600" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/40 via-white/5 to-black/15" />
          <div className="relative flex flex-col items-center justify-center gap-0.5 leading-none">
            <span className="text-[9px] font-semibold text-amber-950">Speed</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-950">
              <Gauge size={11} className="shrink-0" />
              {segment.speed}×
            </span>
          </div>
        </>
      )}
      onReset={(segment) => setSegmentSpeed(segment.id, 1)}
      resetTitle="Reset to 1x"
    />
  );
}
