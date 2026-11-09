'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';

interface CodeSnippet {
  language: string;
  filename: string;
  code: string;
  output: string;
}

const SNIPPETS: Record<string, CodeSnippet> = {
  javascript: {
    language: 'javascript',
    filename: 'server.js',
    code: `import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Hello from CloudIDE!',
    runtime: 'Node.js 20',
    timestamp: Date.now()
  }));
});

server.listen(4000, () => {
  console.log('⚡ Server running at http://localhost:4000');
});`,
    output: `[CloudIDE] Initializing Docker container...
⚡ Server running at http://localhost:4000
GET /api/workspaces -> 200 OK (2.4ms)
Process active inside isolated non-root container [PID: 42]`,
  },
  typescript: {
    language: 'typescript',
    filename: 'types.ts',
    code: `interface ContainerMetrics {
  id: string;
  memoryUsageMb: number;
  cpuQuotaPercentage: number;
  isIsolated: boolean;
}

function verifySandbox(metrics: ContainerMetrics): boolean {
  console.log(\`Checking container \${metrics.id}...\`);
  return metrics.isIsolated && metrics.memoryUsageMb <= 256;
}

const status = verifySandbox({
  id: 'cloudide-ws-01',
  memoryUsageMb: 84.5,
  cpuQuotaPercentage: 50,
  isIsolated: true,
});

console.log('Sandbox status: OK', status);`,
    output: `[TypeScript Engine] Compiling tsconfig.json...
Checking container cloudide-ws-01...
Sandbox status: OK true
Memory: 84.5MB / 256MB limit [Verified]`,
  },
  python: {
    language: 'python',
    filename: 'analysis.py',
    code: `import sys
import math

def calculate_fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print(f"Python Runtime: {sys.version.split()[0]}")
fib = calculate_fibonacci(8)
print("Fibonacci Sequence:", fib)
print("Golden Ratio Approx:", fib[-1] / fib[-2])`,
    output: `[Python 3 Engine] Booting sandbox...
Python Runtime: 3.12.2
Fibonacci Sequence: [0, 1, 1, 2, 3, 5, 8, 13]
Golden Ratio Approx: 1.625
Execution duration: 42ms [Success]`,
  },
};

export function LiveIDEShowcase() {
  const [activeTab, setActiveTab] = useState<'javascript' | 'typescript' | 'python'>('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [copied, setCopied] = useState(false);

  const currentSnippet = SNIPPETS[activeTab];

  const handleRun = () => {
    setIsRunning(true);
    setShowOutput(false);
    setTimeout(() => {
      setIsRunning(false);
      setShowOutput(true);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto relative group"
    >
      {/* Ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/30 via-indigo-500/20 to-purple-500/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Main IDE Mockup Window */}
      <div className="relative rounded-2xl bg-[#0d1117]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Window Top Titlebar */}
        <div className="h-11 px-4 bg-[#161b22]/70 border-b border-white/[0.06] flex items-center justify-between select-none">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
            <span className="ml-3 text-xs font-medium text-slate-400 font-mono hidden sm:inline">
              CloudIDE Interactive Sandbox
            </span>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-[#090d13] p-1 rounded-lg border border-white/[0.04]">
            {(['javascript', 'typescript', 'python'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {tab === 'javascript' ? 'JS server' : tab === 'typescript' ? 'TS types' : 'PY math'}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/50 transition-all"
            >
              <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </motion.button>
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[320px]">
          {/* Code area */}
          <div className="md:col-span-7 p-4 font-mono text-xs text-slate-200 overflow-x-auto border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#0a0d13]/70">
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-white/[0.04] mb-3 select-none">
              <span className="flex items-center gap-1.5">
                <span className="text-sky-400">📄</span> {currentSnippet.filename}
              </span>
              <span>UTF-8</span>
            </div>

            <pre className="leading-relaxed whitespace-pre font-mono">
              {currentSnippet.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell pr-4 text-slate-600 select-none text-right w-6">
                    {idx + 1}
                  </span>
                  <span className="table-cell">
                    {line.includes('import') || line.includes('function') || line.includes('const') || line.includes('def') ? (
                      <span className="text-sky-400 font-semibold">{line}</span>
                    ) : line.includes('console.log') || line.includes('print') ? (
                      <span className="text-amber-300">{line}</span>
                    ) : line.includes('//') || line.includes('#') ? (
                      <span className="text-slate-500 italic">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </span>
                </div>
              ))}
            </pre>
          </div>

          {/* Interactive Output / Terminal Drawer */}
          <div className="md:col-span-5 p-4 bg-[#05070a]/90 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04] mb-3 text-slate-400 select-none">
                <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  Terminal Output
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Live Stream
                </span>
              </div>

              <AnimatePresence mode="wait">
                {showOutput ? (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-300 whitespace-pre-wrap leading-relaxed space-y-1"
                  >
                    {currentSnippet.output.split('\n').map((outLine, idx) => (
                      <div
                        key={idx}
                        className={
                          outLine.includes('[Verified]') || outLine.includes('[Success]')
                            ? 'text-emerald-400 font-medium'
                            : outLine.includes('⚡')
                            ? 'text-sky-300 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        {outLine}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center justify-center text-slate-500 text-center gap-2"
                  >
                    <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>Executing in isolated Docker sandbox...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom mini-status */}
            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 select-none">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Container OK
              </span>
              <span>Memory: 256MB Cap</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
