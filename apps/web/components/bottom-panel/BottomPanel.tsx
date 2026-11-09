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
      <div className="h-full w-full bg-[#09090b] flex items-center justify-center text-xs text-zinc-500 font-mono">
        Starting Bash Terminal...
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
    <div className="h-full w-full flex flex-col bg-[#09090b] border-t border-white/[0.08] select-none text-zinc-300">
      {/* Panel Top Header / Tabs */}
      <div className="h-9 px-2.5 bg-[#0c0c0e] border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {/* Terminal Tab */}
          <button
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all relative ${
              activeBottomTab === 'terminal'
                ? 'text-zinc-100 bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all relative ${
              activeBottomTab === 'problems'
                ? 'text-zinc-100 bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            <span className="text-[10px] px-1.5 rounded bg-white/[0.06] text-zinc-400 font-mono">0</span>
            {activeBottomTab === 'problems' && (
              <motion.div
                layoutId="bottom-tab-active"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400"
              />
            )}
          </button>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-1 text-zinc-400">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>root shell</span>
            </span>
          </div>

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
              title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={toggleBottomPanel}
            className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 w-full h-[calc(100%-36px)] overflow-hidden bg-[#09090b]">
        {activeBottomTab === 'terminal' && (
          <div className="h-full w-full">
            <XtermTerminal />
          </div>
        )}

        {activeBottomTab === 'problems' && (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">
            No problems detected in workspace.
          </div>
        )}
      </div>
    </div>
  );
}
