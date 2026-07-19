import type { JSX } from 'react';
import { useState } from 'react';
import { Droplets, MoveUpRight, Square, Tag, Trash2, Type } from 'lucide-react';
import { cn } from 'cnfast';
import { useCaptureEditorStore } from '../store/editor.store';
import type { CaptureAnnotation } from '../types/editor';

const KIND_ICONS = {
  text: Type,
  label: Tag,
  rect: Square,
  arrow: MoveUpRight,
  blur: Droplets
} as const;

function layerLabel(annotation: CaptureAnnotation): string {
  // Text layers always mirror their content — no custom name.
  if (annotation.kind === 'text') return annotation.text || 'Text';
  if (annotation.name) return annotation.name;
  switch (annotation.kind) {
    case 'label':
      return `Label ${annotation.value}`;
    case 'rect':
      return 'Rectangle';
    case 'arrow':
      return 'Arrow';
    case 'blur':
      return 'Blur';
  }
}

/**
 * Photoshop-style layer list: topmost layer first. Rows are draggable —
 * dropping one onto another moves it to that stacking position (annotations
 * render and export in array order, last = topmost). Double-click renames a
 * layer (except text layers, which mirror their content); the trash button
 * deletes it.
 */
export function LayerPanel(): JSX.Element {
  const annotations = useCaptureEditorStore((s) => s.annotations);
  const selectedId = useCaptureEditorStore((s) => s.selectedId);
  const setSelectedId = useCaptureEditorStore((s) => s.setSelectedId);
  const moveLayer = useCaptureEditorStore((s) => s.moveLayer);
  const removeAnnotation = useCaptureEditorStore((s) => s.removeAnnotation);
  const patchAnnotation = useCaptureEditorStore((s) => s.patchAnnotation);
  const [dragId, setDragId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const topFirst = [...annotations].reverse();

  function commitRename(id: string, value: string): void {
    const trimmed = value.trim();
    // Empty name reverts to the kind-based default.
    patchAnnotation(id, { name: trimmed || undefined });
    setRenamingId(null);
  }

  return (
    <aside className="flex w-44 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface-2">
      <header className="shrink-0 border-b border-border px-3 py-2 text-xs font-medium text-text-dim">
        Layers
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {topFirst.length === 0 && <p className="px-2 py-3 text-xs text-text-dim">No edits yet.</p>}
        {topFirst.map((annotation) => {
          const Icon = KIND_ICONS[annotation.kind];
          const isRenaming = renamingId === annotation.id;
          return (
            <div
              key={annotation.id}
              draggable={!isRenaming}
              onDragStart={() => setDragId(annotation.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dragId !== annotation.id) {
                  moveLayer(
                    dragId,
                    annotations.findIndex((a) => a.id === annotation.id)
                  );
                }
                setDragId(null);
              }}
              onClick={() => setSelectedId(annotation.id)}
              onDoubleClick={() => {
                if (annotation.kind !== 'text') setRenamingId(annotation.id);
              }}
              className={cn(
                'group flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-xs select-none',
                selectedId === annotation.id
                  ? 'bg-surface-4 text-text-base'
                  : 'text-text-dim hover:bg-surface-3 hover:text-text-base',
                dragId === annotation.id && 'opacity-50'
              )}
            >
              <Icon size={13} className="shrink-0" />
              {isRenaming ? (
                <input
                  autoFocus
                  defaultValue={annotation.kind !== 'text' ? (annotation.name ?? '') : ''}
                  placeholder={layerLabel(annotation)}
                  onBlur={(e) => commitRename(annotation.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(annotation.id, e.currentTarget.value);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full min-w-0 rounded-sm border border-border bg-surface px-1 py-0.5 text-xs text-text-base outline-none focus-visible:border-accent"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate">{layerLabel(annotation)}</span>
              )}
              {!isRenaming && (
                <button
                  type="button"
                  aria-label="Delete layer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAnnotation(annotation.id);
                  }}
                  className="shrink-0 cursor-pointer rounded p-0.5 text-text-dim opacity-0 transition-opacity hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
