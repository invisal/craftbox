/**
 * Cursor path smoothing/sampling, shared between the renderer (live editor
 * preview) and the main-process export compositor so both draw the exact
 * same trajectory. One sample of the recorded system cursor, normalized
 * (0-1) to the captured source's bounds.
 */
export interface CursorPathPoint {
  atMs: number;
  x: number;
  y: number;
}

/**
 * Time-aware exponential smoothing: each point is pulled toward the previous
 * *smoothed* point, so jitter gets absorbed while a sustained fast movement
 * (many frames in the same direction) still catches up. `smoothing` is
 * 0 (off, path returned untouched) - 1 (heaviest smoothing/lag). The pull
 * factor is scaled by the actual time delta between samples so uneven
 * sampling (dropped frames, variable poll rate) doesn't change the effective
 * amount of smoothing.
 */
export function smoothCursorPath(path: CursorPathPoint[], smoothing: number): CursorPathPoint[] {
  const amount = Math.min(Math.max(smoothing, 0), 1);
  if (path.length < 3 || amount <= 0) return path;

  // Half-life (ms) of the exponential pull at max smoothing; interpolated
  // down to ~0 at `smoothing = 0` so the slider has an even, gradual feel.
  const maxHalfLifeMs = 220;
  const halfLifeMs = amount * maxHalfLifeMs;

  const result: CursorPathPoint[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const prev = result[i - 1];
    const point = path[i];
    const dtMs = Math.max(0, point.atMs - prev.atMs);
    const alpha = halfLifeMs > 0 ? 1 - Math.pow(0.5, dtMs / halfLifeMs) : 1;
    result.push({
      atMs: point.atMs,
      x: prev.x + (point.x - prev.x) * alpha,
      y: prev.y + (point.y - prev.y) * alpha
    });
  }
  return result;
}

/**
 * Linear interpolation of the (smoothed) path at a given timeline position.
 * Clamps to the first/last sample outside the recorded range. Returns null
 * only for an empty path -- callers should treat that as "no cursor to draw".
 */
export function sampleCursorPath(
  path: CursorPathPoint[],
  atMs: number
): { x: number; y: number } | null {
  if (path.length === 0) return null;
  if (atMs <= path[0].atMs) return path[0];
  const last = path[path.length - 1];
  if (atMs >= last.atMs) return last;

  for (let i = 1; i < path.length; i++) {
    const next = path[i];
    if (next.atMs < atMs) continue;
    const prev = path[i - 1];
    const span = next.atMs - prev.atMs;
    const t = span > 0 ? (atMs - prev.atMs) / span : 0;
    return { x: prev.x + (next.x - prev.x) * t, y: prev.y + (next.y - prev.y) * t };
  }
  return null;
}
