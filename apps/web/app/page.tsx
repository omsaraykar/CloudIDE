'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code,
  Plus,
  Terminal,
  FolderCode,
  Trash2,
  Clock,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Check,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Workspace, WorkspaceLanguage } from '@cloud-ide/shared';

export default function WelcomePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{ dockerAvailable: boolean; platform: string }>({
    dockerAvailable: false,
    platform: 'unknown',
  });

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<WorkspaceLanguage>('javascript');
  const [template, setTemplate] = useState<'starter' | 'algorithms' | 'express' | 'empty'>('starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [list, status] = await Promise.all([
        api.getWorkspaces(),
        api.getSystemStatus(),
      ]);
      setWorkspaces(list);
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWorkspace = async (
    customName?: string,
    customLang?: WorkspaceLanguage,
    customTemplate?: 'starter' | 'algorithms' | 'express' | 'empty'
  ) => {
    const wsName = customName || name.trim() || `${(customLang || language)}-project`;
    const wsLang = customLang || language;
    const wsTemplate = customTemplate || template;

    try {
      setIsSubmitting(true);
      const ws = await api.createWorkspace({
        name: wsName,
        language: wsLang,
        template: wsTemplate,
      });
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      console.error('Create workspace failed:', err);
      alert('Failed to create workspace. Make sure backend is running.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this workspace?')) {
      try {
        await api.deleteWorkspace(id);
        setWorkspaces(workspaces.filter((w) => w.id !== id));
      } catch (err) {
        console.error('Failed to delete workspace:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-ide-border bg-[#0f131a] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ide-accent to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
            IDE
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Cloud<span className="text-ide-accent">IDE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-subtle text-ide-muted border border-ide-border">
                v1.0.0
              </span>
            </h1>
          </div>
        </div>

        {/* System & Docker Engine Status */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-ide-surface border border-ide-border text-ide-muted">
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus.dockerAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'
              }`}
            />
            <span>
              Engine: {systemStatus.dockerAvailable ? 'Docker Containers' : 'Isolated Process Sandbox'}
            </span>
          </div>

          <button
            onClick={() => {
              setName(`workspace-${Date.now().toString().slice(-4)}`);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ide-accent hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Workspace</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#131722] to-[#0f121a] border border-ide-border rounded-xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Full-Stack Cloud Development Environment</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Code, execute, and inspect in real time.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by Monaco Editor, isolated Docker containers, interactive xterm.js terminals,
              and live filesystem synchronization via Chokidar.
            </p>
          </div>

          {/* Quick-Start Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <button
              onClick={() => handleCreateWorkspace('nodejs-starter', 'javascript', 'starter')}
              disabled={isSubmitting}
              className="flex flex-col text-left p-3.5 rounded-lg bg-ide-surface/80 hover:bg-ide-subtle border border-ide-border hover:border-amber-400/50 transition-all group"
            >
              <div className="w-7 h-7 rounded bg-amber-400/10 text-amber-400 flex items-center justify-center mb-2 font-bold text-xs">
                JS
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-amber-300">
                Node.js JavaScript
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Starter math & performance playground</span>
            </button>

            <button
              onClick={() => handleCreateWorkspace('typescript-sandbox', 'typescript', 'starter')}
              disabled={isSubmitting}
              className="flex flex-col text-left p-3.5 rounded-lg bg-ide-surface/80 hover:bg-ide-subtle border border-ide-border hover:border-blue-400/50 transition-all group"
            >
              <div className="w-7 h-7 rounded bg-blue-400/10 text-blue-400 flex items-center justify-center mb-2 font-bold text-xs">
                TS
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-blue-300">
                TypeScript Sandbox
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Type-safe development with compiler</span>
            </button>

            <button
              onClick={() => handleCreateWorkspace('python-scripts', 'python', 'starter')}
              disabled={isSubmitting}
              className="flex flex-col text-left p-3.5 rounded-lg bg-ide-surface/80 hover:bg-ide-subtle border border-ide-border hover:border-yellow-400/50 transition-all group"
            >
              <div className="w-7 h-7 rounded bg-yellow-400/10 text-yellow-400 flex items-center justify-center mb-2 font-bold text-xs">
                PY
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-yellow-300">
                Python 3 Engine
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Clean Python execution & scripting</span>
            </button>

            <button
              onClick={() => handleCreateWorkspace('web-html5', 'html', 'starter')}
              disabled={isSubmitting}
              className="flex flex-col text-left p-3.5 rounded-lg bg-ide-surface/80 hover:bg-ide-subtle border border-ide-border hover:border-orange-400/50 transition-all group"
            >
              <div className="w-7 h-7 rounded bg-orange-400/10 text-orange-400 flex items-center justify-center mb-2 font-bold text-xs">
                &lt;&gt;
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-orange-300">
                HTML5 & CSS Web
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Web front-end structure & styling</span>
            </button>
          </div>
        </div>

        {/* Workspaces List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <FolderCode className="w-4 h-4 text-ide-accent" />
              <span>Your Workspaces ({workspaces.length})</span>
            </h3>
            <button
              onClick={loadData}
              className="text-xs text-ide-muted hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="h-40 rounded-xl border border-ide-border bg-ide-surface/50 flex items-center justify-center text-xs text-ide-muted">
              Loading your workspaces...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="h-48 rounded-xl border border-dashed border-ide-border bg-ide-surface/30 flex flex-col items-center justify-center p-6 text-center">
              <Code className="w-8 h-8 text-ide-muted mb-2" />
              <p className="text-sm font-medium text-slate-300">No workspaces yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Create a new workspace or pick a quick-start template above.
              </p>
              <button
                onClick={() => {
                  setName('my-first-workspace');
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-md bg-ide-accent hover:bg-sky-400 text-slate-950 text-xs font-semibold"
              >
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="group p-4 rounded-xl border border-ide-border bg-[#0f131a] hover:border-ide-borderLight hover:bg-[#141923] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-ide-subtle border border-ide-border flex items-center justify-center font-bold text-xs">
                          {ws.language === 'javascript' ? (
                            <span className="text-amber-400">JS</span>
                          ) : ws.language === 'typescript' ? (
                            <span className="text-blue-400">TS</span>
                          ) : ws.language === 'python' ? (
                            <span className="text-yellow-400">PY</span>
                          ) : (
                            <span className="text-orange-400">&lt;&gt;</span>
                          )}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-semibold text-white group-hover:text-ide-accent transition-colors truncate">
                            {ws.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {ws.language} • {ws.template || 'starter'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(ws.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-ide-subtle text-slate-400 hover:text-rose-400 transition-all"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ide-border/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ws.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-ide-accent font-medium group-hover:translate-x-0.5 transition-transform">
                      Open IDE
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-ide-border rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-semibold text-white mb-1">Create New Workspace</h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure your isolated container workspace.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateWorkspace();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. data-structures, express-server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-ide-panel border border-ide-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-ide-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Language / Runtime
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'javascript', label: 'JavaScript (Node.js)' },
                      { id: 'typescript', label: 'TypeScript' },
                      { id: 'python', label: 'Python 3' },
                      { id: 'html', label: 'HTML & CSS Web' },
                    ] as const
                  ).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id)}
                      className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                        language === lang.id
                          ? 'bg-ide-accent/10 border-ide-accent text-white font-semibold'
                          : 'bg-ide-surface border-ide-border text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as any)}
                  className="w-full bg-ide-panel border border-ide-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-ide-accent"
                >
                  <option value="starter">Starter Playground (Recommended)</option>
                  <option value="algorithms">Algorithms & Data Structures</option>
                  <option value="express">Express REST API Template</option>
                  <option value="empty">Blank Workspace</option>
                </select>
              </div>

              <div className="pt-3 border-t border-ide-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-ide-border text-xs text-slate-300 hover:bg-ide-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-ide-accent hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
