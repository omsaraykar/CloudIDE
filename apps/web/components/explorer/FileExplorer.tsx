'use client';

import React, { useState } from 'react';
import {
  FilePlus,
  FolderPlus,
  RefreshCw,
  Search,
  Check,
  X,
  FileCode,
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

  const filteredTree = filterQuery.trim()
    ? fileTree.filter((item) =>
        item.name.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : fileTree;

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-r border-white/[0.08] select-none text-zinc-300">
      {/* Explorer Top Header */}
      <div className="h-9 px-3 border-b border-white/[0.06] flex items-center justify-between text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
        <span className="font-semibold text-zinc-400">EXPLORER</span>

        {/* Action icons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleStartCreate('file')}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate('directory')}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1 rounded transition-colors ${
              showSearch ? 'text-white bg-white/[0.08]' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Filter Files"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => loadFileTree()}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="Refresh Files"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {showSearch && (
        <div className="p-2 border-b border-white/[0.06] bg-[#09090b]">
          <input
            type="text"
            placeholder="Search files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#141418] border border-white/[0.08] focus:border-zinc-500 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto px-1 py-1.5 font-mono text-xs">
        {/* Inline Creation Input */}
        {isCreating && (
          <form
            onSubmit={handleConfirmCreate}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#141418] border border-sky-500/50 rounded my-0.5"
          >
            <span className="text-[11px] text-zinc-400">
              {isCreating === 'file' ? '📄' : '📁'}
            </span>
            <input
              type="text"
              autoFocus
              placeholder={isCreating === 'file' ? 'index.html' : 'folder-name'}
              value={newInputName}
              onChange={(e) => setNewInputName(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none flex-1 min-w-0 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelCreate();
              }}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5">
              <Check className="w-3 h-3" />
            </button>
            <button type="button" onClick={handleCancelCreate} className="text-zinc-500 hover:text-zinc-300 p-0.5">
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
          <div className="flex flex-col items-center justify-center py-12 px-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
              <FileCode className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-zinc-400 mb-1">
              {filterQuery ? 'No matching files' : 'Workspace is empty'}
            </p>
            <p className="text-[11px] text-zinc-500 mb-4 max-w-[160px] leading-relaxed">
              Create a file or use the terminal below to start coding.
            </p>
            <button
              onClick={() => handleStartCreate('file')}
              className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-sans transition-colors flex items-center gap-1.5"
            >
              <FilePlus className="w-3 h-3" />
              <span>New File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
