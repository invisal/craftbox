import { ChevronRight, HardDrive } from 'lucide-react';
import { cn } from 'cnfast';
import { useEffect, useState } from 'react';
import { Menu } from '@renderer/components/ui/Menu';
import { splitPathSegments } from '../lib/paths';
import { getFavoriteIcon } from '../lib/sidebarIcons';
import type { SidebarSections } from '../../../../preload/file-explorer/api';

interface BreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb(props: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 p-1 px-1 bg-surface border-b border-border">
      <BreadcrumbInner {...props} />
    </div>
  );
}

export function BreadcrumbInner({ currentPath, onNavigate }: BreadcrumbProps) {
  const segments = splitPathSegments(currentPath);

  return (
    <>
      <div>
        <BreadcrumbLocationPicker onNavigate={onNavigate} />
      </div>
      <div
        className={cn(
          'flex flex-1 items-center px-1 h-8 text-xs overflow-x-auto shrink-0 select-none', // Layout
          'bg-surface-2', // Background
          'border border-border rounded', // Border
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),inset_0_-1px_0_rgba(255,255,255,0.05)]' // 3D inset
        )}
      >
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={segment.path} className="flex items-center gap-1 shrink-0">
              {i > 0 && (
                <BreadcrumbSegmentMenu path={segments[i - 1].path} onNavigate={onNavigate} />
              )}
              <button
                onClick={() => onNavigate(segment.path)}
                disabled={isLast}
                className={cn(
                  'px-2 h-6 rounded max-w-48 truncate text-xs border border-surface-2',
                  isLast
                    ? 'text-text-base font-medium cursor-default'
                    : 'text-text-dim cursor-pointer hover:bg-surface hover:border-border'
                )}
              >
                {segment.label}
              </button>
            </span>
          );
        })}
      </div>
    </>
  );
}

function BreadcrumbLocationPicker({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [sections, setSections] = useState<SidebarSections | null>(null);

  useEffect(() => {
    window.fileExplorer.getSidebarSections().then(setSections);
  }, []);

  return (
    <Menu.Root>
      <Menu.Trigger
        title="Locations"
        render={
          <button className="h-8 w-8 flex items-center justify-center hover:bg-surface-2 rounded border border-transparent hover:border-border cursor-pointer">
            <HardDrive size={14} />
          </button>
        }
      />

      <Menu.Content align="start">
        {sections && sections.favorites.length > 0 && (
          <Menu.Group>
            <Menu.GroupLabel>Favorites</Menu.GroupLabel>
            {sections.favorites.map((item) => {
              const Icon = getFavoriteIcon(item.label);
              return (
                <Menu.Item key={item.path} onClick={() => onNavigate(item.path)}>
                  <Icon size={14} className="shrink-0 text-zinc-500" />
                  <span className="truncate">{item.label}</span>
                </Menu.Item>
              );
            })}
          </Menu.Group>
        )}
        {sections && sections.locations.length > 0 && (
          <Menu.Group>
            <Menu.GroupLabel>Locations</Menu.GroupLabel>
            {sections.locations.map((item) => (
              <Menu.Item key={item.path} onClick={() => onNavigate(item.path)}>
                <HardDrive size={14} className="shrink-0 text-zinc-500" />
                <span className="truncate">{item.label}</span>
              </Menu.Item>
            ))}
          </Menu.Group>
        )}
      </Menu.Content>
    </Menu.Root>
  );
}

type SubfolderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      folders: { name: string; path: string }[];
    };

function BreadcrumbSegmentMenu({
  path,
  onNavigate
}: {
  path: string;
  onNavigate: (path: string) => void;
}) {
  const [state, setState] = useState<SubfolderState>({ status: 'idle' });

  function handleOpenChange(open: boolean) {
    if (!open || state.status !== 'idle') return;

    setState({ status: 'loading' });
    window.fileExplorer.listDirectory(path).then((res) => {
      if ('error' in res) {
        setState({ status: 'error' });
        return;
      }
      setState({
        status: 'ready',
        folders: res.entries
          .filter((entry) => entry.isDirectory)
          .map((entry) => ({ name: entry.name, path: entry.path }))
      });
    });
  }

  return (
    <Menu.Root onOpenChange={handleOpenChange}>
      <Menu.Trigger className="flex items-center h-6 w-4 justify-center shrink-0 rounded hover:bg-surface border border-transparent hover:border-border cursor-pointer">
        <ChevronRight size={12} className="text-zinc-600 shrink-0" />
      </Menu.Trigger>
      <Menu.Content align="start">
        {state.status === 'loading' && (
          <Menu.Item disabled>
            <span className="text-text-dim">Loading…</span>
          </Menu.Item>
        )}
        {state.status === 'error' && (
          <Menu.Item disabled>
            <span className="text-text-dim">Cannot access this folder</span>
          </Menu.Item>
        )}
        {state.status === 'ready' && state.folders.length === 0 && (
          <Menu.Item disabled>
            <span className="text-text-dim">No subfolders</span>
          </Menu.Item>
        )}
        {state.status === 'ready' &&
          state.folders.map((folder) => (
            <Menu.Item key={folder.path} onClick={() => onNavigate(folder.path)}>
              <span className="truncate">{folder.name}</span>
            </Menu.Item>
          ))}
      </Menu.Content>
    </Menu.Root>
  );
}
