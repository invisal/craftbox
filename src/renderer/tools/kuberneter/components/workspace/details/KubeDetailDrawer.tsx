import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useLayoutStore } from '../../../../../src/store/layout.store';
import { useKuberneterStore } from '../../../store/kuberneter.store';
import { DetailContent } from './DetailContent';

interface KubeDetailDrawerProps {
  tabId: string;
}

export const KubeDetailDrawer: React.FC<KubeDetailDrawerProps> = ({ tabId }) => {
  const { activeInstanceId, openTab } = useLayoutStore();
  const drawerState = useKuberneterStore((s) => s.kuberneterTabDrawers[tabId]);
  const setDrawerState = useKuberneterStore((s) => s.setKuberneterTabDrawerState);

  const [isAnimating, setIsAnimating] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);
  const width = drawerState?.width ?? 320;
  const widthRef = useRef(width);

  useEffect(() => {
    widthRef.current = width;
    if (drawerRef.current) {
      drawerRef.current.style.width = `${width}px`;
    }
  }, [width]);

  if (!drawerState || !drawerState.isOpen || !drawerState.contentType) {
    return null;
  }

  const { contentType, payload } = drawerState;

  const handleClose = () => {
    setDrawerState(tabId, { isOpen: false });
  };

  const handleMaximize = () => {
    if (!payload || !contentType) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resourceName = (payload as any).name || '';

    // Close drawer first
    setDrawerState(tabId, { isOpen: false });

    // Open new tab
    openTab({
      id: `kuberneter-${contentType}-detail-${resourceName}-${activeInstanceId}`,
      title: `${contentType}: ${resourceName}`,
      type: 'kuberneter',
      instanceId: activeInstanceId,
      meta: {
        resource: `${contentType}-detail`,
        payload: payload
      }
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startWidth = widthRef.current;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const newWidth = Math.max(240, Math.min(startWidth + (startX - moveEvent.clientX), 800));
      widthRef.current = newWidth;
      if (drawerRef.current) {
        drawerRef.current.style.width = `${newWidth}px`;
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try {
        (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // Safe to ignore if target element doesn't support pointer capture
      }

      setDrawerState(tabId, { width: widthRef.current });
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const titleNames: Record<string, string> = {
    pod: 'Pod Details',
    deployment: 'Deployment Details',
    daemonset: 'Daemon Set Details',
    statefulset: 'Stateful Set Details',
    replicaset: 'Replica Set Details',
    job: 'Job Details',
    cronjob: 'Cron Job Details'
  };

  return (
    <div
      ref={drawerRef}
      style={{ width: `${width}px` }}
      onAnimationEnd={() => setIsAnimating(false)}
      className={`absolute top-0 right-0 z-30 bg-sidebar-bg border-l border-border-dark flex flex-col h-full select-none shadow-2xl ${
        isAnimating ? 'animate-in slide-in-from-right duration-200' : ''
      }`}
    >
      {/* Resize Handle on the left side of the drawer */}
      <div
        onPointerDown={handlePointerDown}
        className="absolute top-0 left-0 w-[4px] h-full cursor-col-resize hover:bg-accent/40 active:bg-accent transition-colors z-40"
      />

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between border-b border-border-dark pb-2 shrink-0">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {titleNames[contentType] || 'Details'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMaximize}
              title="Open in new tab"
              className="text-zinc-400 hover:text-white cursor-pointer hover:bg-border-dark/40 p-1 rounded transition-colors border-none bg-transparent flex items-center justify-center"
            >
              <Maximize2 className="size-3.5" />
            </button>
            <button
              onClick={handleClose}
              title="Close drawer"
              className="text-zinc-400 hover:text-white cursor-pointer hover:bg-border-dark/40 p-1 rounded transition-colors border-none bg-transparent flex items-center justify-center"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <DetailContent contentType={contentType} payload={payload} />
        </div>
      </div>
    </div>
  );
};
