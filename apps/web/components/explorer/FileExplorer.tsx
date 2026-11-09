'use client';

import React, { useState } from 'react';
import {
  FilePlus,
  FolderPlus,
  RefreshCw,
  FolderTree,
  Search,
  Check,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { FileTreeNode } from './FileTreeNode';

export function FileExplorer() {
  const {
    workspace,
    fileTree,
    loadFileTree,
    createNode,
  } = useWorkspaceStore();

  const [isCreating, setIsCreating] = useState<'file' | 'directory' | null>(null);
  const [newInputName, setNewInputName] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleStartCreate = (type: 'file' | 'directory') => {
    setIsCreating(type);
    setNewInputName('');
  };

  const handleConfirmCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newInputName.trim() || !isCreating) {
      setIsCreating(null);
      return;
    }

    try {
      await createNode(newInputName.trim(), isCreating);
    } catch (err) {
      console.error('Failed to create file/dir', err);
    } finally {
      setIsCreating(null);
      setNewInputName('');
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(null);
    setNewInputName('');
  };

  // Filtered files for search
  const filteredTree = filterQuery.trim()
    ? fileTree.filter((item) =>
        item.name.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : fileTree;

  return (
    <div className="h-full flex flex-col bg-ide-surface border-r border-ide-border select-none">
      {/* Explorer Top Header */}
      <div className="h-9 px-3 border-b border-ide-border flex items-center justify-between text-xs font-semibold tracking-wider text-ide-muted uppercase">
        <div className="flex items-center gap-1.5 truncate">
          <FolderTree className="w-3.5 h-3.5 text-ide-accent" />
          <span className="truncate">{workspace?.name || 'Explorer'}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartCreate('file')}
            className="p-1 rounded hover:bg-ide-subtle text-ide-muted hover:text-white transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate('directory')}
            className="p-1 rounded hover:bg-ide-subtle text-ide-muted hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1 rounded transition-colors ${
              showSearch ? 'text-ide-accent bg-ide-subtle' : 'text-ide-muted hover:text-white hover:bg-ide-subtle'
            }`}
            title="Filter Files"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => loadFileTree()}
            className="p-1 rounded hover:bg-ide-subtle text-ide-muted hover:text-white transition-colors"
            title="Refresh Files"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {showSearch && (
        <div className="p-2 border-b border-ide-border bg-ide-panel/50">
          <input
            type="text"
            placeholder="Search files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded px-2 py-1 text-xs text-white placeholder-ide-muted focus:outline-none focus:border-ide-accent"
          />
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto px-1 py-1.5">
        {/* Inline Creation Input */}
        {isCreating && (
          <form
            onSubmit={handleConfirmCreate}
            className="flex items-center gap-1 px-2 py-1 bg-ide-panel border border-ide-accent rounded my-0.5"
          >
            <span className="text-xs text-ide-accent">
              {isCreating === 'file' ? '📄' : '📁'}
            </span>
            <input
              type="text"
              autoFocus
              placeholder={isCreating === 'file' ? 'file.js' : 'folder-name'}
              value={newInputName}
              onChange={(e) => setNewInputName(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none flex-1 min-w-0"
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelCreate();
              }}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5">
              <Check className="w-3 h-3" />
            </button>
            <button type="button" onClick={handleCancelCreate} className="text-rose-400 hover:text-rose-300 p-0.5">
              <X className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* Tree Nodes */}
        {filteredTree.length > 0 ? (
          filteredTree.map((node) => (
            <FileTreeNode key={node.id || node.path} node={node} depth={0} />
          ))
        ) : (
          <div className="text-center py-8 text-xs text-ide-muted">
            {filterQuery ? 'No matching files found' : 'No files in workspace'}
          </div>
        )}
      </div>
    </div>
  );
}
