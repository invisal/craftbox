import type React from 'react';
import { KubeSearchbox } from '../../KubeSearchbox';
import { Download } from 'lucide-react';

interface EventsToolbarProps {
  searchQuery: string;
  caseSensitive: boolean;
  useRegex: boolean;
  totalCount: number;
  selectedCount: number;
  namespaces: string[];
  selectedNamespace: string;
  onSearchChange: (value: string) => void;
  onCaseSensitiveToggle: () => void;
  onRegexToggle: () => void;
  onDownload: () => void;
  onNamespaceChange: (value: string) => void;
}

export const EventsToolbar: React.FC<EventsToolbarProps> = ({
  searchQuery,
  caseSensitive,
  useRegex,
  totalCount,
  selectedCount,
  namespaces,
  selectedNamespace,
  onSearchChange,
  onCaseSensitiveToggle,
  onRegexToggle,
  onDownload,
  onNamespaceChange
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <select
          value={selectedNamespace}
          onChange={(e) => onNamespaceChange(e.target.value)}
          className="bg-surface-3 border border-border-dark/60 rounded text-[11px] px-2 py-1 text-zinc-300 focus:outline-none focus:ring-0 cursor-pointer h-7"
        >
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns === 'All Namespaces' ? 'All namespaces' : ns}
            </option>
          ))}
        </select>

        <KubeSearchbox
          value={searchQuery}
          placeholder="Search Events..."
          onChange={onSearchChange}
          className="w-64"
          showToggles
          caseSensitive={caseSensitive}
          onCaseSensitiveToggle={onCaseSensitiveToggle}
          useRegex={useRegex}
          onRegexToggle={onRegexToggle}
        />
      </div>

      <div
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer select-none"
        onClick={onDownload}
      >
        <Download className="size-3.5" />
        <span className="text-[11px] font-medium">
          {selectedCount > 0 ? `${selectedCount} / ` : ''}
          {totalCount} Items
        </span>
      </div>
    </div>
  );
};
