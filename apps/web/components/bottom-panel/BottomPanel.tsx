'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Terminal as TerminalIcon,
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
  const { toggleBottomPanel } = useWorkspaceStore();

  return (
    <div className="h-full w-full flex flex-col bg-[#09090b] border-t border-white/[0.08] select-none text-zinc-300">
      {/* Panel Top Header */}
      <div className="h-9 px-2.5 bg-[#0c0c0e] border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {/* Terminal Tab */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-zinc-100 bg-white/[0.06] relative">
            <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Bash Terminal</span>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400" />
          </div>
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
        <XtermTerminal />
      </div>
    </div>
  );
}
