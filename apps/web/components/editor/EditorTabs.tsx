'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { FileIcon } from '../explorer/FileIcon';

export function EditorTabs() {
  const {
    openFiles,
    activeFilePath,
    setActiveFile,
    closeFile,
    isPreviewOpen,
    togglePreview,
  } = useWorkspaceStore();

  if (openFiles.length === 0) return null;

  const isActiveHtml = activeFilePath?.endsWith('.html') || activeFilePath?.endsWith('.htm');

  return (
    <div className="h-9 bg-[#0b0e14] border-b border-white/[0.06] flex items-center justify-between select-none pr-2">
      <div className="flex items-center overflow-x-auto no-scrollbar h-full">
        <AnimatePresence initial={false}>
          {openFiles.map((file) => {
            const isActive = file.path === activeFilePath;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`group h-full flex items-center gap-2 px-3 text-xs border-r border-white/[0.06] cursor-pointer transition-colors relative ${
                  isActive
                    ? 'bg-[#12161f] text-white font-medium'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                {/* Active top line highlight */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400"
                  />
                )}

                <FileIcon name={file.name} type="file" />
                <span className="truncate max-w-[140px] font-mono text-[11px]" title={file.path}>
                  {file.name}
                </span>

                {/* Dirty or Close indicator */}
                <div className="flex items-center ml-1">
                  {file.isDirty ? (
                    <div
                      className="w-2 h-2 rounded-full bg-sky-400 group-hover:hidden"
                      title="Unsaved changes"
                    />
                  ) : null}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.path);
                    }}
                    className={`p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white ${
                      file.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Close Tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Quick Action for HTML Live Preview */}
      {isActiveHtml && (
        <button
          onClick={togglePreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            isPreviewOpen
              ? 'text-sky-300 bg-sky-500/15 border border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
          title={isPreviewOpen ? 'Hide Browser Preview' : 'Show Browser Preview'}
        >
          <Globe className="w-3 h-3 text-sky-400" />
          <span>{isPreviewOpen ? 'Hide Preview' : 'Live Preview'}</span>
        </button>
      )}
    </div>
  );
}
