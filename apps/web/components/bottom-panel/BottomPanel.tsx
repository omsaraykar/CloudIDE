'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
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

const XtermTerminal = dynamic(
  () => import('../terminal/XtermTerminal').then((m) => m.XtermTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#0a0d12] flex items-center justify-center text-xs text-ide-muted">
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
    const text = outputLogs.map((l) => l.text).join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-ide-surface border-t border-ide-border select-none">
      {/* Panel Top Header / Tabs */}
      <div className="h-9 px-2 bg-ide-surface border-b border-ide-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {/* Terminal Tab */}
          <button
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors ${
              activeBottomTab === 'terminal'
                ? 'bg-ide-panel text-ide-accent border-b-2 border-b-ide-accent'
                : 'text-ide-muted hover:text-white hover:bg-ide-subtle'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          {/* Output Tab */}
          <button
            onClick={() => setBottomTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors relative ${
              activeBottomTab === 'output'
                ? 'bg-ide-panel text-ide-accent border-b-2 border-b-ide-accent'
                : 'text-ide-muted hover:text-white hover:bg-ide-subtle'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Output</span>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Problems Tab */}
          <button
            onClick={() => setBottomTab('problems')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors ${
              activeBottomTab === 'problems'
                ? 'bg-ide-panel text-ide-accent border-b-2 border-b-ide-accent'
                : 'text-ide-muted hover:text-white hover:bg-ide-subtle'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            <span className="text-[10px] px-1 rounded-full bg-ide-subtle text-ide-muted">0</span>
          </button>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-1 text-ide-muted">
          {activeBottomTab === 'output' && (
            <>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-ide-subtle hover:text-white transition-colors"
                title="Copy Output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={clearOutput}
                className="p-1 rounded hover:bg-ide-subtle hover:text-white transition-colors"
                title="Clear Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1 rounded hover:bg-ide-subtle hover:text-white transition-colors"
              title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={toggleBottomPanel}
            className="p-1 rounded hover:bg-ide-subtle hover:text-white transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden bg-[#0a0d12]">
        {activeBottomTab === 'terminal' && <XtermTerminal />}

        {activeBottomTab === 'output' && (
          <div
            ref={outputContainerRef}
            className="h-full w-full p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap select-text leading-relaxed text-ide-text"
          >
            {outputLogs.length === 0 ? (
              <div className="text-ide-muted/60 italic text-center py-6 select-none font-sans">
                No execution logs yet. Click &quot;Run&quot; or press Ctrl+Enter to execute code.
              </div>
            ) : (
              outputLogs.map((log) => {
                let colorClass = 'text-ide-text';
                if (log.type === 'stderr' || log.type === 'error') {
                  colorClass = 'text-rose-400';
                } else if (log.type === 'info') {
                  colorClass = 'text-sky-400 font-semibold';
                } else if (log.type === 'success') {
                  colorClass = 'text-emerald-400 font-semibold';
                }
                return (
                  <span key={log.id} className={colorClass}>
                    {log.text}
                  </span>
                );
              })
            )}
          </div>
        )}

        {activeBottomTab === 'problems' && (
          <div className="h-full w-full p-6 flex flex-col items-center justify-center text-center text-xs text-ide-muted select-none">
            <AlertCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
            <p className="font-medium text-white mb-0.5">No problems detected in workspace</p>
            <p className="text-[11px] text-ide-muted">Syntax diagnostics and errors will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
