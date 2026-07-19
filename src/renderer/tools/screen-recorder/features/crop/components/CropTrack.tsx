import type { JSX } from 'react';
import { Crop } from 'lucide-react';
import { useTimelineStore } from '../../timeline/store/timeline-store';
import { SegmentFlagTrack } from '../../timeline/components/SegmentFlagTrack';

/** Pill track for clips with a crop applied -- see SegmentFlagTrack.tsx. */
export function CropTrack(): JSX.Element | null {
  const setSegmentCrop = useTimelineStore((s) => s.setSegmentCrop);

  return (
    <SegmentFlagTrack
      hasFlag={(segment) => segment.crop !== null}
      getTitle={(segment) =>
        segment.crop
          ? `${Math.round(segment.crop.width * 100)}% × ${Math.round(segment.crop.height * 100)}% -- drag to reorder`
          : ''
      }
      colorClassName="border-sky-900/40 text-sky-950"
      renderContent={(segment) =>
        segment.crop && (
          <>
            {/* Same two-layer gradient as ZoomTrack's pills (ZoomTrack.tsx) --
                a base color fill, then a light-at-bottom-fading-to-dark-at-top
                highlight on top, just sky instead of purple. */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-sky-400 via-sky-500 to-sky-600" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/40 via-white/5 to-black/15" />
            <div className="relative flex flex-col items-center justify-center gap-0.5 leading-none">
              <span className="text-[9px] font-semibold text-sky-950">Crop</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-950">
                <Crop size={11} className="shrink-0" />
                {Math.round(segment.crop.width * 100)}%
              </span>
            </div>
          </>
        )
      }
      onReset={(segment) => setSegmentCrop(segment.id, null)}
      resetTitle="Clear crop"
    />
  );
}
