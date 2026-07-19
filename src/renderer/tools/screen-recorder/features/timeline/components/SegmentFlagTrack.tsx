import type { JSX, ReactNode } from 'react';
import type { TimelineSegment } from '@screen-recorder/types/timeline';
import { ContextMenu } from '@renderer/components/ui/ContextMenu';
import { useTimelineStore, PRIMARY_VIDEO_TRACK_ID } from '../store/timeline-store';
import { getSegmentOutputDurationMs } from '../lib/segment-duration';
import { CLIP_ROW_HEIGHT_PX } from '../lib/assign-lanes';
import { useSegmentReorderDrag } from '../lib/use-segment-reorder-drag';
import { cn } from '../../../lib/utils';

export interface SegmentFlagTrackProps {
  hasFlag: (segment: TimelineSegment) => boolean;
  getTitle: (segment: TimelineSegment) => string;
  /**
   * Pill border/text color classes only, e.g. `'border-amber-900/40
   * text-amber-950'` -- no `bg-*`, matching PillTrack.tsx's own
   * `colorClassName` contract: the fill is two absolutely-positioned
   * gradient layers `renderContent` draws itself (a color gradient, then a
   * shared white-to-black sheen), so this stays visually identical to
   * ZoomTrack/CaptionTrack/etc.'s pills instead of a flat `bg-*` swatch.
   */
  colorClassName: string;
  renderContent: (segment: TimelineSegment) => ReactNode;
  onReset: (segment: TimelineSegment) => void;
  resetTitle: string;
}

/**
 * Shared shape behind Speed/Crop tracks: unlike PillTrack's
 * independently-timed items, these pills mirror a clip that already exists
 * in CutTimeline's own row 1:1 -- same output-order width/position, no
 * independent start/duration of their own -- so there's nothing here to
 * drag-move or edge-resize. Only clips matching `hasFlag` get a pill; the
 * rest render as a same-width invisible spacer so every clip stays a drag
 * target for reordering (`useSegmentReorderDrag`, the same action
 * CutTimeline's own row uses). Right-click a pill for a context menu with
 * `resetTitle` (`onReset`) -- same affordance as PillTrack.tsx's Delete,
 * instead of a permanently-competing hover button.
 *
 * Sized and shaped to match PillTrack's pills exactly (`CLIP_ROW_HEIGHT_PX`
 * tall, `rounded-md`, `overflow-hidden` so callers' gradient fill clips to
 * the pill shape) -- these read as one consistent track-pill style across
 * the whole per-tool track stack, not a visually distinct "flag" style.
 */
export function SegmentFlagTrack({
  hasFlag,
  getTitle,
  colorClassName,
  renderContent,
  onReset,
  resetTitle
}: SegmentFlagTrackProps): JSX.Element | null {
  const segments = useTimelineStore(
    (s) => s.tracks.find((t) => t.id === PRIMARY_VIDEO_TRACK_ID)?.segments ?? []
  );
  const selectedSegmentId = useTimelineStore((s) => s.selectedSegmentId);
  const setSelectedSegmentId = useTimelineStore((s) => s.setSelectedSegmentId);
  const { dragOverIndex, getDragHandlers } = useSegmentReorderDrag();

  const totalDurationMs = segments.reduce((sum, s) => sum + getSegmentOutputDurationMs(s), 0);
  const clampedTotal = totalDurationMs > 0 ? totalDurationMs : 1;
  const hasAny = segments.some(hasFlag);
  // See PillTrack.tsx for why this is `null`, not an empty placeholder div.
  if (!hasAny) return null;

  return (
    <div className="flex shrink-0 items-center py-1 px-1">
      <div className="flex flex-1 items-center gap-0.5" style={{ height: CLIP_ROW_HEIGHT_PX }}>
        {segments.map((segment, index) => {
          const widthPercent = (getSegmentOutputDurationMs(segment) / clampedTotal) * 100;
          if (!hasFlag(segment)) {
            return (
              <div
                key={segment.id}
                {...getDragHandlers(index)}
                className={cn(
                  'h-full cursor-grab',
                  dragOverIndex === index && 'ring-2 ring-accent'
                )}
                style={{ width: `${widthPercent}%` }}
              />
            );
          }
          return (
            <ContextMenu.Root key={segment.id}>
              <ContextMenu.Trigger
                render={
                  <div
                    {...getDragHandlers(index)}
                    onClick={() => setSelectedSegmentId(segment.id)}
                    title={getTitle(segment)}
                    style={{ width: `${widthPercent}%`, height: CLIP_ROW_HEIGHT_PX }}
                    className={cn(
                      'group relative flex min-w-9 cursor-grab items-center justify-center gap-1 overflow-hidden rounded-md border px-2 active:cursor-grabbing',
                      colorClassName,
                      selectedSegmentId === segment.id && 'ring-2 ring-white/70',
                      dragOverIndex === index && 'ring-2 ring-accent'
                    )}
                  >
                    {renderContent(segment)}
                  </div>
                }
              />
              <ContextMenu.Content>
                <ContextMenu.Item onClick={() => onReset(segment)}>{resetTitle}</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          );
        })}
      </div>
    </div>
  );
}
