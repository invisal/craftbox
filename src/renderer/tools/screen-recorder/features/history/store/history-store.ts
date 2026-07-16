import { create } from 'zustand';

/**
 * One entry in the undo/redo stack: a snapshot of every registered store's
 * undoable slice, keyed by the same string each store registers itself
 * under (see `withHistory`). Snapshotting the whole document at once (not
 * per-store diffs) keeps cross-store ordering trivial -- undo always
 * restores everything to exactly how it looked at that point in time,
 * regardless of which panel made the change.
 */
type HistorySnapshot = Record<string, unknown>;

interface HistorySlice {
  getSnapshot: () => unknown;
  restore: (value: unknown) => void;
}

/** Caps memory growth for very long editing sessions. */
const MAX_HISTORY_ENTRIES = 100;
/**
 * How long a burst of rapid changes (dragging a trim handle, scrubbing a
 * slider) can stay "open" before the *next* change is treated as a new,
 * separate undo step. The burst's entry is committed to `past` the moment
 * it starts, not after this window elapses -- the window only controls
 * merging of whatever follows, so Undo enables the instant something
 * happens instead of lagging behind every edit.
 */
const BURST_WINDOW_MS = 500;

const registry = new Map<string, HistorySlice>();

let isRestoring = false;
let burstActive = false;
let burstTimer: ReturnType<typeof setTimeout> | null = null;

function captureSnapshot(): HistorySnapshot {
  const snapshot: HistorySnapshot = {};
  for (const [key, slice] of registry) snapshot[key] = slice.getSnapshot();
  return snapshot;
}

function restoreSnapshot(snapshot: HistorySnapshot): void {
  isRestoring = true;
  try {
    for (const [key, slice] of registry) {
      if (key in snapshot) slice.restore(snapshot[key]);
    }
  } finally {
    isRestoring = false;
  }
}

/** Ends whatever burst is currently merging changes, so the next change starts a fresh undo step. */
function closeBurst(): void {
  if (burstTimer !== null) {
    clearTimeout(burstTimer);
    burstTimer = null;
  }
  burstActive = false;
}

/**
 * Registers a store's undoable slice. Called once per store, at module load
 * (see `withHistory`) -- not tied to React lifecycle, since undo must work
 * across the whole app session regardless of which panels are mounted.
 */
export function registerHistorySlice(
  key: string,
  getSnapshot: () => unknown,
  restore: (value: unknown) => void
): void {
  registry.set(key, { getSnapshot, restore });
}

/** True while `undo`/`redo` is replaying a snapshot -- lets `withHistory` skip re-recording those writes. */
export function isApplyingHistory(): boolean {
  return isRestoring;
}

/**
 * Called by `withHistory` right before a registered store applies a real
 * content change. The *first* change of a burst commits the pre-change
 * snapshot to `past` immediately and clears `future`; changes that follow
 * within `BURST_WINDOW_MS` reuse that same entry instead of pushing more --
 * e.g. every pointermove of a trim-handle drag collapses into the one entry
 * captured when the drag started.
 */
export function recordChange(): void {
  if (isRestoring) return;
  if (!burstActive) {
    burstActive = true;
    const before = captureSnapshot();
    const past = [...useHistoryStore.getState().past, before].slice(-MAX_HISTORY_ENTRIES);
    useHistoryStore.setState({ past, future: [] });
  }
  if (burstTimer !== null) clearTimeout(burstTimer);
  burstTimer = setTimeout(closeBurst, BURST_WINDOW_MS);
}

interface HistoryStoreState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  undo: () => void;
  redo: () => void;
}

/**
 * Cross-store undo/redo for the editor. Individual feature stores (timeline,
 * zoom, background, ...) don't know this exists -- they opt in by wrapping
 * their creator in `withHistory`, which registers their undoable slice here
 * and routes their writes through `recordChange`. Components only need this
 * store for the `past`/`future` lengths (to enable/disable buttons) and the
 * `undo`/`redo` actions themselves.
 */
export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  past: [],
  future: [],
  undo: () => {
    closeBurst();
    const { past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = captureSnapshot();
    restoreSnapshot(previous);
    set({ past: past.slice(0, -1), future: [...future, current] });
  },
  redo: () => {
    closeBurst();
    const { past, future } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const current = captureSnapshot();
    restoreSnapshot(next);
    set({ future: future.slice(0, -1), past: [...past, current] });
  }
}));

/**
 * Clears the undo/redo stack -- call this at a session boundary (a
 * *different* recording loading into the editor, not just a re-render of
 * the same one) so a fresh session can't be undone back into whatever the
 * previous recording's edits looked like. Doesn't touch the content stores
 * themselves; callers are expected to (re)initialize those separately, e.g.
 * `EditorPage`'s `initializeFromDuration` call.
 */
export function resetHistory(): void {
  closeBurst();
  useHistoryStore.setState({ past: [], future: [] });
}
