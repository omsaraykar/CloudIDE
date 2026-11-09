'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

const XtermTerminal = dynamic(
  () => import('../terminal/XtermTerminal').then((m) => m.XtermTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#0a0d12] flex items-center justify-center text-xs text-slate-500">
        Loading Terminal...
      </div>
    ),
  }
);

interface BottomPanelProps {
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export function BottomPanel({ isMaximized = false, onToggleMaximize }: BottomPanelProps) {
  const {
    activeBottomTab,
    setBottomTab,
    toggleBottomPanel,
  } = useWorkspaceStore();

  return (
    <div className="h-full w-full flex flex-col bg-[#080b10] border-t border-white/[0.06] select-none">
      {/* Panel Top Header / Tabs */}
      <div className="h-9 px-2 bg-[#0c0f16] border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {/* Terminal Tab */}
          <button
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all relative ${
              activeBottomTab === 'terminal'
                ? 'text-sky-400 bg-white/[0.04]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Bash Terminal</span>
            {activeBottomTab === 'terminal' && (
              <motion.div
                layoutId="bottom-tab-active"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400"
              />
            )}
          </button>

          {/* Problems Tab */}
          <button
            onClick={() => setBottomTab('problems')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all relative ${
              activeBottomTab === 'problems'
                ? 'text-sky-400 bg-white/[0.04]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.04] text-slate-400">0</span>
            {activeBottomTab === 'problems' && (
              <motion.div
                layoutId="bottom-tab-active"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400"
              />
            )}
          </button>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-1 text-slate-400">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>bash (container)</span>
            </span>
          </div>

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1 rounded-md hover:bg-white/[0.05] hover:text-white transition-colors"
              title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={toggleBottomPanel}
            className="p-1 rounded-md hover:bg-white/[0.05] hover:text-white transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden bg-[#05070a]">
        {activeBottomTab === 'terminal' && <XtermTerminal />}

        {activeBottomTab === 'problems' && (
          <div className="h-full w-full p-6 flex flex-col items-center justify-center text-center text-xs text-slate-400 select-none">
            <AlertCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold text-white mb-0.5">No problems detected in workspace</p>
            <p className="text-[11px] text-slate-500">Syntax diagnostics and errors will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
