import type { JSX, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { TimelineSegment } from '@screen-recorder/types/timeline';
import { useTimelineStore } from '../store/timeline-store';
import { sourceMsToOutputMs } from '../lib/segment-duration';

interface PlayheadProps {
  segments: Pick<TimelineSegment, 'range' | 'speed'>[];
  clampedTotal: number;
  onPointerDown: (event: React.PointerEvent) => void;
  /** The horizontally-scrolling track area (CutTimeline's `overflow-auto` wrapper) -- scrolled to keep the playhead in view as it moves past either edge. */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Split out from CutTimeline so *only this* subscribes to `playheadMs` --
 * PreviewStage now updates it every animation frame (for smooth motion,
 * matching the zoom transform's own rAF-driven clock) rather than only on
 * the video's coarse `timeupdate` event. If CutTimeline itself read
 * `playheadMs`, that 60fps update would re-render the whole track stack
 * (every clip, every tick, every other track) on every frame; isolating it
 * here means only this small line+marker re-renders that often.
 */
export function Playhead({
  segments,
  clampedTotal,
  onPointerDown,
  scrollContainerRef
}: PlayheadProps): JSX.Element | null {
  const playheadMs = useTimelineStore((s) => s.playheadMs);
  const markerRef = useRef<HTMLDivElement>(null);

  // Keep the playhead in view as it moves past either edge of the (horizontally
  // zoomed, `overflow-auto`) track area -- e.g. during playback, or while
  // scrubbing near an edge. `marker.offsetLeft` is relative to its offset
  // parent (CutTimeline's `trackAreaRef`), which is the scroll container's
  // direct, unpadded child, so it lines up with `scrollLeft` directly. Only
  // adjusts `scrollLeft` when the playhead actually falls outside the
  // current viewport, so it doesn't fight a manual scroll otherwise.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const marker = markerRef.current;
    if (!container || !marker) return;
    const markerX = marker.offsetLeft;
    const viewStart = container.scrollLeft;
    const viewEnd = viewStart + container.clientWidth;
    if (markerX < viewStart) {
      container.scrollLeft = markerX;
    } else if (markerX > viewEnd) {
      container.scrollLeft = markerX - container.clientWidth;
    }
  }, [playheadMs, scrollContainerRef]);

  // `null` while scrubbing through a cut-out gap (the preview still plays
  // the raw source continuously; see PreviewStage), so the playhead just
  // isn't shown until playback re-enters a kept segment.
  const outputPlayheadMs = sourceMsToOutputMs(segments, playheadMs);
  if (outputPlayheadMs === null) return null;

  return (
    <div
      ref={markerRef}
      className="pointer-events-none absolute inset-y-0 z-10 mx-0.5"
      style={{ left: `${(outputPlayheadMs / clampedTotal) * 100}%` }}
    >
      <div className="absolute inset-y-0 left-0 w-px bg-accent" />
      <div
        onPointerDown={onPointerDown}
        title="Drag to scrub"
        className="pointer-events-auto absolute -left-1.25 top-0 h-0 w-0 cursor-ew-resize border-x-[5px] border-t-[7px] border-x-transparent border-t-accent"
      />
    </div>
  );
}
