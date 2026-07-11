import { ComponentType, useEffect, useState } from 'react';
import { Download, FileText, HardDrive, Home, Monitor } from 'lucide-react';
import { cn } from 'cnfast';
import type { SidebarItem, SidebarSections } from '../../../../preload/file-explorer/api';

interface FileExplorerSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

type IconComponent = ComponentType<{ size?: number; className?: string }>;

const favoriteIcons: Record<string, IconComponent> = {
  Home,
  Desktop: Monitor,
  Documents: FileText,
  Downloads: Download
};

function normalize(target: string): string {
  return target.replace(/[\\/]+$/, '').toLowerCase();
}

export function FileExplorerSidebar({ currentPath, onNavigate }: FileExplorerSidebarProps) {
  const [sections, setSections] = useState<SidebarSections | null>(null);

  useEffect(() => {
    window.fileExplorer.getSidebarSections().then(setSections);
  }, []);

  if (!sections) return null;

  return (
    <div className="flex flex-col gap-4">
      <SidebarSection
        title="Favorites"
        items={sections.favorites}
        currentPath={currentPath}
        onNavigate={onNavigate}
        getIcon={(item) => favoriteIcons[item.label] ?? Home}
      />
      <SidebarSection
        title="Locations"
        items={sections.locations}
        currentPath={currentPath}
        onNavigate={onNavigate}
        getIcon={() => HardDrive}
      />
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  items: SidebarItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  getIcon: (item: SidebarItem) => IconComponent;
}

function SidebarSection({ title, items, currentPath, onNavigate, getIcon }: SidebarSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
        {title}
      </span>
      {items.map((item) => {
        const Icon = getIcon(item);
        const isActive = normalize(currentPath) === normalize(item.path);
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            title={item.path}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded text-xs text-left cursor-pointer transition-colors',
              isActive
                ? 'bg-surface-4 text-text-base'
                : 'text-text-dim hover:bg-surface-3 hover:text-text-base'
            )}
          >
            <Icon size={14} className="shrink-0 text-zinc-500" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
