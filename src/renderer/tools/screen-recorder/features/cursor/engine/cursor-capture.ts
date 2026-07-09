import type { CaptureSource } from '@screen-studio/types/recording';
import type { CursorPathPoint } from '@screen-studio/types/project';

export interface CursorCaptureHandle {
  /** Stops main-process polling and returns every sample collected, in order. */
  stop: () => Promise<CursorPathPoint[]>;
}

/**
 * Starts recording the system cursor's position alongside a screen capture.
 * Returns `null` (nothing to start) for 'window' sources, since a window has
 * no fixed screen bounds to normalize against -- see
 * `CaptureSource.displayBounds`.
 */
export async function startCursorCapture(
  source: CaptureSource,
  startedAt: number
): Promise<CursorCaptureHandle | null> {
  if (source.type !== 'screen' || !source.displayBounds) {
    console.warn(
      `[cursor-capture] skipping cursor tracking for "${source.name}" (type: ${source.type}, displayBounds: ${Boolean(source.displayBounds)}) -- only 'screen' sources with resolved display bounds are tracked.`
    );
    return null;
  }

  const samples: CursorPathPoint[] = [];
  const unsubscribe = window.screenStudio.cursor.onSample((sample) => {
    samples.push(sample);
  });

  await window.screenStudio.cursor.startTracking(source.displayBounds, startedAt);

  return {
    stop: async () => {
      await window.screenStudio.cursor.stopTracking();
      unsubscribe();
      console.log(`[cursor-capture] recorded ${samples.length} cursor sample(s).`);
      return samples;
    }
  };
}
