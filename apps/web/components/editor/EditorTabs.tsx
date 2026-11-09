'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { FileIcon } from '../explorer/FileIcon';

export function EditorTabs() {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
  } = useWorkspaceStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="h-9 bg-ide-surface border-b border-ide-border flex items-center overflow-x-auto select-none no-scrollbar">
      {openFiles.map((file) => {
        const isActive = file.path === activeFilePath;
        return (
          <div
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`group h-full flex items-center gap-2 px-3 text-xs border-r border-ide-border cursor-pointer transition-colors relative ${
              isActive
                ? 'bg-ide-panel text-white font-medium border-t-2 border-t-ide-accent'
                : 'text-ide-muted hover:bg-ide-subtle hover:text-ide-text'
            }`}
          >
            <FileIcon name={file.name} type="file" />
            <span className="truncate max-w-[140px]" title={file.path}>
              {file.name}
            </span>

            {/* Dirty or Close indicator */}
            <div className="flex items-center ml-1">
              {file.isDirty ? (
                <div
                  className="w-2 h-2 rounded-full bg-ide-accent group-hover:hidden"
                  title="Unsaved changes"
                />
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
                className={`p-0.5 rounded hover:bg-ide-subtle text-ide-muted hover:text-white ${
                  file.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
