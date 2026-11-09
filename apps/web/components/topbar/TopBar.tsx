'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  CheckCircle2,
  Clock,
  CircleDot,
  Terminal as TerminalIcon,
  ChevronLeft,
  Cpu,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export function TopBar() {
  const {
    workspace,
    activeFilePath,
    saveStatus,
    isRunning,
    runCode,
    stopCode,
    toggleBottomPanel,
    isBottomPanelOpen,
    isPreviewOpen,
    togglePreview,
  } = useWorkspaceStore();

  const handleRun = () => {
    runCode();
  };

  const handleStop = () => {
    stopCode();
  };

  const languageLabel = (lang?: string) => {
    switch (lang) {
      case 'javascript':
        return 'Node.js (JS)';
      case 'typescript':
        return 'TypeScript';
      case 'python':
        return 'Python 3';
      case 'html':
        return 'HTML5 / Web';
      default:
        return 'JavaScript';
    }
  };

  return (
    <header className="h-12 bg-[#090c12]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-3 select-none z-20">
      {/* Left: Brand + Back + Workspace Info */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-xs font-medium group"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-[11px] shadow-md shadow-sky-500/20">
            IDE
          </div>
          <span className="font-bold text-xs tracking-tight text-white">
            Cloud<span className="text-sky-400">IDE</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* Current Workspace Name & Language */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.08]">
            {workspace?.name || 'Workspace'}
          </span>
          <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.05] hidden md:inline-flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-sky-400" />
            {languageLabel(workspace?.language)}
          </span>
        </div>
      </div>

      {/* Center: Execution & Save Controls */}
      <div className="flex items-center gap-2">
        {/* Run Button */}
        <motion.button
          whileHover={!isRunning && activeFilePath ? { scale: 1.04 } : {}}
          whileTap={!isRunning && activeFilePath ? { scale: 0.96 } : {}}
          onClick={handleRun}
          disabled={isRunning || !activeFilePath}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative overflow-hidden ${
            isRunning
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-wait shadow-sm shadow-emerald-500/20'
              : !activeFilePath
              ? 'bg-white/[0.03] text-slate-500 border border-white/[0.05] cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 cursor-pointer active:scale-95'
          }`}
          title={activeFilePath ? `Run ${activeFilePath} (Ctrl+Enter)` : 'Open a file to run'}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
          {isRunning && (
            <motion.div
              layoutId="running-glow"
              className="absolute inset-0 bg-emerald-400/10 pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
        </motion.button>

        {/* Stop Button */}
        <motion.button
          whileTap={isRunning ? { scale: 0.95 } : {}}
          onClick={handleStop}
          disabled={!isRunning}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isRunning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
              : 'bg-white/[0.02] text-slate-600 border border-transparent cursor-not-allowed'
          }`}
          title="Stop execution"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </motion.button>

        {/* Live Browser Preview Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={togglePreview}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isPreviewOpen
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/20'
              : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]'
          }`}
          title="Toggle Live Web Preview"
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Preview</span>
          {isPreviewOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />
          )}
        </motion.button>

        {/* Active file indicator */}
        {activeFilePath && (
          <span className="text-xs text-slate-400 hidden lg:inline-block max-w-[160px] truncate font-mono">
            {activeFilePath}
          </span>
        )}
      </div>

      {/* Right: Autosave status & Panel Toggles */}
      <div className="flex items-center gap-3">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
          <AnimatePresence mode="wait">
            {saveStatus === 'saved' && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 hidden sm:inline">Saved</span>
              </motion.div>
            )}
            {saveStatus === 'saving' && (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-300 hidden sm:inline">Saving...</span>
              </motion.div>
            )}
            {saveStatus === 'unsaved' && (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <CircleDot className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="text-amber-400 hidden sm:inline">Unsaved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Panel Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleBottomPanel}
          className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
            isBottomPanelOpen
              ? 'bg-sky-500/15 border-sky-400/40 text-sky-400 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Toggle Terminal & Output Panel"
        >
          <TerminalIcon className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-mono">Terminal</span>
        </motion.button>
      </div>
    </header>
  );
}
