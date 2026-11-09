'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Square,
  CheckCircle2,
  Clock,
  CircleDot,
  Terminal as TerminalIcon,
  FolderGit2,
  ChevronLeft,
  Cpu,
  Layers,
  Sparkles,
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
    activeBottomTab,
    setBottomTab,
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
    <header className="h-12 bg-ide-surface border-b border-ide-border flex items-center justify-between px-3 select-none z-20">
      {/* Left: Brand + Back + Workspace Info */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1 rounded text-ide-muted hover:text-white hover:bg-ide-subtle transition-colors text-xs font-medium"
          title="Back to Workspaces"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Workspaces</span>
        </Link>

        <div className="h-4 w-[1px] bg-ide-border" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ide-accent to-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xs tracking-wider">
            IDE
          </div>
          <span className="font-semibold text-sm tracking-tight text-ide-text">
            Cloud<span className="text-ide-accent">IDE</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-ide-border" />

        {/* Current Workspace Name & Language */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white px-2 py-0.5 rounded bg-ide-panel border border-ide-border">
            {workspace?.name || 'Workspace'}
          </span>
          <span className="text-[11px] text-ide-muted px-2 py-0.5 rounded bg-ide-subtle/60 border border-ide-border/50 hidden md:inline-flex items-center gap-1">
            <Cpu className="w-3 h-3 text-ide-accent" />
            {languageLabel(workspace?.language)}
          </span>
        </div>
      </div>

      {/* Center: Execution & Save Controls */}
      <div className="flex items-center gap-2">
        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning || !activeFilePath}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all ${
            isRunning
              ? 'bg-ide-subtle text-ide-muted cursor-not-allowed border border-ide-border'
              : !activeFilePath
              ? 'bg-ide-subtle text-ide-muted/50 cursor-not-allowed border border-ide-border/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-95'
          }`}
          title={activeFilePath ? `Run ${activeFilePath}` : 'Open a file to run'}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={handleStop}
          disabled={!isRunning}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            isRunning
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 active:scale-95'
              : 'bg-ide-subtle/40 text-ide-muted/40 cursor-not-allowed border border-transparent'
          }`}
          title="Stop execution"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </button>

        {/* Active file indicator */}
        {activeFilePath && (
          <span className="text-xs text-ide-muted hidden lg:inline-block max-w-[160px] truncate">
            {activeFilePath}
          </span>
        )}
      </div>

      {/* Right: Autosave status & Panel Toggles */}
      <div className="flex items-center gap-3">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-ide-panel/80 border border-ide-border/50">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-ide-muted hidden sm:inline">Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300 hidden sm:inline">Saving...</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <CircleDot className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-400 hidden sm:inline">Unsaved</span>
            </>
          )}
        </div>

        {/* Bottom Panel Toggle */}
        <button
          onClick={toggleBottomPanel}
          className={`p-1.5 rounded-md border text-xs transition-colors flex items-center gap-1.5 ${
            isBottomPanelOpen
              ? 'bg-ide-active border-ide-borderLight text-ide-accent'
              : 'bg-ide-subtle border-ide-border text-ide-muted hover:text-white'
          }`}
          title="Toggle Terminal & Output Panel"
        >
          <TerminalIcon className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Terminal</span>
        </button>
      </div>
    </header>
  );
}
