import type { StateCreator } from 'zustand';
import { isApplyingHistory, recordChange, registerHistorySlice } from '../store/history-store';

/**
 * Wraps a Zustand store creator so every state change it makes becomes one
 * entry in the shared cross-store undo/redo stack in `history-store.ts`.
 *
 * `partialize` picks exactly which fields count as undoable content --
 * leave out transient UI state (selection ids, "armed"/interaction-mode
 * flags, drag-in-progress state) so undo only ever touches the document,
 * never fights the UI by snapping selection or tool mode back too.
 *
 * Usage: `create<State>(withHistory('background', (s) => ({ ...content
 * fields }), (set, get) => ({ ...the store as usual })))`.
 */
export function withHistory<T extends object>(
  key: string,
  partialize: (state: T) => Partial<T>,
  config: StateCreator<T, [], []>
): StateCreator<T, [], []> {
  return (set, get, api) => {
    // zustand's `setState` is overloaded (partial-merge vs. full-replace);
    // this wrapper only changes *when* a write is recorded, never its
    // shape, so forwarding the arguments through untyped and casting back
    // to the real overloaded signature is safe.
    const wrappedSet = ((partial: unknown, replace?: boolean) => {
      if (!isApplyingHistory()) recordChange();
      (set as (partial: unknown, replace?: boolean) => void)(partial, replace);
    }) as typeof set;

    registerHistorySlice(
      key,
      () => partialize(get()),
      (value) => set(value as Partial<T>, false)
    );

    return config(wrappedSet, get, api);
  };
}
