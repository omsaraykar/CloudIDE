'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronLeft,
  Globe,
  PanelLeft,
  PanelBottom,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export function TopBar() {
  const {
    workspace,
    fileTree,
    openFiles,
    activeFilePath,
    saveStatus,
    toggleBottomPanel,
    isBottomPanelOpen,
    toggleSidebar,
    isSidebarOpen,
    isPreviewOpen,
    togglePreview,
  } = useWorkspaceStore();

  const isHtmlActive = Boolean(activeFilePath?.endsWith('.html') || activeFilePath?.endsWith('.htm'));
  const hasOpenHtml = openFiles.some((f) => f.path.endsWith('.html') || f.path.endsWith('.htm'));
  const checkTreeHtml = (nodes: any[]): boolean => {
    return nodes.some(
      (n) => n.path?.endsWith('.html') || n.path?.endsWith('.htm') || (n.children && checkTreeHtml(n.children))
    );
  };
  const isHtmlDetected = isHtmlActive || hasOpenHtml || checkTreeHtml(fileTree);

  return (
    <header className="h-[42px] bg-[#09090b] border-b border-white/[0.08] flex items-center justify-between px-3 select-none z-20 font-sans">
      {/* Left: Dashboard Back + Branding + Workspace Name */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          title="Back to Welcome / Login"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        <div className="h-3.5 w-[1px] bg-white/[0.1] mx-0.5" />

        <span className="font-medium text-xs text-zinc-200 tracking-tight">
          CloudIDE
        </span>

        <div className="h-3.5 w-[1px] bg-white/[0.1] mx-0.5" />

        {/* Workspace Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] text-zinc-300 truncate max-w-[140px]">
            {workspace?.name || 'workspace'}
          </span>
        </div>
      </div>

      {/* Center: Live Preview & File Path */}
      <div className="flex items-center gap-2">
        {/* Live Browser Preview Toggle Button - ONLY shown when HTML file is detected */}
        {isHtmlDetected && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={togglePreview}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              isPreviewOpen
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/[0.08]'
            }`}
            title="Toggle Live Web Preview"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Preview</span>
            {isPreviewOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />
            )}
          </motion.button>
        )}

        {/* Active file indicator */}
        {activeFilePath && (
          <span className="text-[11px] text-zinc-400 hidden md:inline-block max-w-[220px] truncate font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
            {activeFilePath}
          </span>
        )}
      </div>

      {/* Right: Autosave status & Panel Toggles (Sidebar & Bottom Terminal) */}
      <div className="flex items-center gap-2">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1 text-[11px] text-zinc-400 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.06]">
          <AnimatePresence mode="wait">
            {saveStatus === 'saved' && (
              <motion.div
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-zinc-400"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Saved</span>
              </motion.div>
            )}
            {saveStatus === 'saving' && (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-amber-300"
              >
                <Clock className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving</span>
              </motion.div>
            )}
            {saveStatus === 'unsaved' && (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-amber-400"
              >
                <CircleDot className="w-3 h-3 animate-pulse" />
                <span className="hidden sm:inline">Unsaved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-3.5 w-[1px] bg-white/[0.1] mx-0.5" />

        {/* Layout Panel Toggles */}
        <div className="flex items-center gap-1">
          {/* Toggle Explorer Sidebar */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              isSidebarOpen
                ? 'text-zinc-100 bg-white/[0.08] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="Toggle Explorer Sidebar (Ctrl+B)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Toggle Terminal / Bottom Panel */}
          <button
            onClick={toggleBottomPanel}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              isBottomPanelOpen
                ? 'text-zinc-100 bg-white/[0.08] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="Toggle Bash Terminal (Ctrl+`)"
          >
            <PanelBottom className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
