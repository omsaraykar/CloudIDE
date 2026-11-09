'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  Activity,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { renderAnsi, stripAnsi } from '../../lib/ansi';

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
    outputLogs,
    clearOutput,
    isRunning,
  } = useWorkspaceStore();

  const [copied, setCopied] = React.useState(false);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll output when new logs arrive
  useEffect(() => {
    if (activeBottomTab === 'output' && outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [outputLogs, activeBottomTab]);

  const handleCopy = () => {
    const text = stripAnsi(outputLogs.map((l) => l.text).join(''));
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <span>Terminal</span>
            {activeBottomTab === 'terminal' && (
              <motion.div
                layoutId="bottom-tab-active"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400"
              />
            )}
          </button>

          {/* Output Tab */}
          <button
            onClick={() => setBottomTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all relative ${
              activeBottomTab === 'output'
                ? 'text-sky-400 bg-white/[0.04]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Output</span>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
            {activeBottomTab === 'output' && (
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
          {activeBottomTab === 'output' && (
            <>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-white/[0.05] hover:text-white transition-colors"
                title="Copy Output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={clearOutput}
                className="p-1 rounded-md hover:bg-white/[0.05] hover:text-white transition-colors"
                title="Clear Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

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

        {activeBottomTab === 'output' && (
          <div
            ref={outputContainerRef}
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace",
              fontVariantLigatures: 'none',
            }}
            className="h-full w-full p-3.5 text-xs overflow-y-auto whitespace-pre select-text leading-snug text-slate-200"
          >
            {outputLogs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-8 select-none font-sans">
                No execution logs yet. Click &quot;Run&quot; or press Ctrl+Enter to execute code.
              </div>
            ) : (
              outputLogs.map((log) => {
                let colorClass = 'text-slate-200';
                if (log.type === 'stderr' || log.type === 'error') {
                  colorClass = 'text-rose-400 font-medium';
                } else if (log.type === 'info') {
                  colorClass = 'text-sky-300 font-semibold';
                } else if (log.type === 'success') {
                  colorClass = 'text-emerald-400 font-semibold';
                }
                return (
                  <span key={log.id} className={colorClass}>
                    {renderAnsi(log.text)}
                  </span>
                );
              })
            )}
          </div>
        )}

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
