import type React from 'react';
import { useState } from 'react';
import { useToolTabs } from '../providers/ToolProvider';
import { FolderOpen, GlobeIcon, HomeIcon, PlusIcon, VideoIcon, CameraIcon } from 'lucide-react';
import cn from 'cnfast';
import { ContextMenu } from '../ui/ContextMenu';
import { ToolDialog } from '../dialog/ToolDialog';
import kuberneterIcon from '@renderer/assets/kuberneter-icon.svg';

export const ActivityBar: React.FC = () => {
  const { tabs, activeTabId, selectTab, closeTab } = useToolTabs();
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <HomeIcon size={16} />;
      case 'http-client':
        return <GlobeIcon size={16} className="text-inherit" />;
      case 'screen-recorder':
        return <VideoIcon size={16} />;
      case 'screen-capture':
        return <CameraIcon size={16} />;
      case 'kuberneter':
        return (
          <img
            src={kuberneterIcon}
            className="size-5 select-none pointer-events-none"
            alt="Kuberneter"
          />
        );
      case 'file-explorer':
        return <FolderOpen size={16} className="text-inherit" />;
      default:
        return <GlobeIcon size={16} />;
    }
  };

  return (
    <div className="w-11 divide-y divide-border bg-surface border-r border-border flex flex-col items-center">
      {tabs.map((tab) => (
        <ContextMenu.Root key={tab.id}>
          <ContextMenu.Trigger
            render={
              <button
                className={cn(
                  'size-11 flex justify-center items-center cursor-pointer transition-colors',
                  tab.id === activeTabId ? 'bg-blue-300 text-blue-900' : 'hover:bg-surface-2'
                )}
                onClick={() => selectTab(tab.id)}
              >
                {renderIcon(tab.type)}
              </button>
            }
          />
          <ContextMenu.Content>
            <ContextMenu.Item onClick={() => closeTab(tab.id)}>Close</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      ))}

      <button
        className="size-11 flex justify-center items-center cursor-pointer transition-colors hover:bg-surface-2 text-zinc-400"
        onClick={() => setIsToolDialogOpen(true)}
      >
        <PlusIcon size={16} />
      </button>

      <div className="flex-1 w-full bg-surface-2 bg-diagonal-stripes" />

      <ToolDialog open={isToolDialogOpen} onOpenChange={setIsToolDialogOpen} />
    </div>
  );
};
