'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Play,
  ArrowRight,
  Boxes,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Workspace, WorkspaceLanguage } from '@cloud-ide/shared';
import { LiveIDEShowcase } from '../components/landing/LiveIDEShowcase';
import { FeaturesSection } from '../components/landing/FeaturesSection';

const HeroCanvas3D = dynamic(
  () => import('../components/landing/HeroCanvas3D').then((m) => m.HeroCanvas3D),
  { ssr: false }
);

export default function WelcomePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-sky-500/30 selection:text-white">
      {/* 3D Three.js Interactive Particle Background */}
      <HeroCanvas3D />

      {/* Ambient gradient top illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-sky-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/[0.06] bg-[#070a0f]/60 backdrop-blur-xl px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
              IDE
            </div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Cloud<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">IDE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 font-normal">
                v1.0
              </span>
            </span>
          </Link>
        </div>

        {/* Engine status indicator & CTA */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus.dockerAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-400">
              Engine: <strong className="text-white">{systemStatus.dockerAvailable ? 'Docker Containers' : 'Isolated Sandbox'}</strong>
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setName(`workspace-${Date.now().toString().slice(-4)}`);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Workspace</span>
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-12 md:py-16 flex flex-col gap-16 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Shimmering Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-300 mb-6 backdrop-blur-md shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent font-medium">
              Next-Generation Browser IDE
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-slate-400 font-mono text-[11px]">Real Containers. Real PTY.</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-5 leading-[1.1]"
          >
            Code at the speed of thought,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              anywhere in the cloud.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-8"
          >
            Full-featured Monaco Editor, isolated Docker containers, interactive xterm.js terminals,
            and real-time filesystem synchronization with Chokidar.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCreateWorkspace('nodejs-quickstart', 'javascript', 'starter')}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-semibold text-sm shadow-xl shadow-sky-500/25 transition-all group"
            >
              <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
              <span>Launch Node.js Playground</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setName(`workspace-${Date.now().toString().slice(-4)}`);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-sm transition-all backdrop-blur-md"
            >
              <Boxes className="w-4 h-4 text-sky-400" />
              <span>Custom Workspace</span>
            </motion.button>
          </motion.div>

          {/* Quick-select Language Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400"
          >
            <span className="text-slate-500 text-[11px] font-mono mr-1">Runtimes:</span>
            {[
              { lang: 'javascript', label: 'Node.js 20', color: 'hover:border-amber-400/50 hover:text-amber-300' },
              { lang: 'typescript', label: 'TypeScript 5.7', color: 'hover:border-blue-400/50 hover:text-blue-300' },
              { lang: 'python', label: 'Python 3.12', color: 'hover:border-yellow-400/50 hover:text-yellow-300' },
              { lang: 'html', label: 'Web (HTML/CSS)', color: 'hover:border-orange-400/50 hover:text-orange-300' },
            ].map((r) => (
              <button
                key={r.lang}
                onClick={() => handleCreateWorkspace(`${r.lang}-app`, r.lang as any, 'starter')}
                className={`px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 transition-all ${r.color}`}
              >
                {r.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Interactive Live IDE Showcase */}
        <LiveIDEShowcase />

        {/* Feature Cards Grid */}
        <FeaturesSection />

        {/* Workspaces Management Section */}
        <section className="pt-4 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <FolderCode className="w-5 h-5 text-sky-400" />
                <span>Your Active Workspaces</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 font-normal">
                  {workspaces.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Persistent environments backed by Docker volumes and PostgreSQL.
              </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50 transition-colors w-48 sm:w-60"
                />
              </div>

              <button
                onClick={loadData}
                className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-slate-300 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-44 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-xs text-slate-500 gap-2">
              <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading workspaces...</span>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-52 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center p-6 text-center"
            >
              <Code className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white">No workspaces found</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {searchQuery ? `No matches for "${searchQuery}"` : 'Create your first containerized workspace to begin.'}
              </p>
              <button
                onClick={() => {
                  setName('my-playground');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold shadow-md shadow-sky-500/20"
              >
                Create Workspace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredWorkspaces.map((ws) => (
                  <motion.div
                    key={ws.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/workspace/${ws.id}`}
                      className="group p-5 rounded-2xl border border-white/[0.06] bg-[#0c1017]/80 hover:bg-[#111620] hover:border-sky-500/30 transition-all flex flex-col justify-between h-44 backdrop-blur-xl relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center font-bold text-xs shadow-inner">
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
                            <h4 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                              {ws.name}
                            </h4>
                            <span className="text-xs text-slate-400 capitalize">
                              {ws.language} • {ws.template || 'starter'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDelete(ws.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-rose-400 transition-all"
                          title="Delete Workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {new Date(ws.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-sky-400 font-medium group-hover:translate-x-1 transition-transform text-xs">
                          Launch IDE
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#070a0f]/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">CloudIDE</span>
            <span>•</span>
            <span>Isolated Cloud Development Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Monaco</span>
            <span>•</span>
            <span>Dockerode</span>
            <span>•</span>
            <span>xterm.js</span>
            <span>•</span>
            <span>Fastify & Socket.IO</span>
          </div>
        </div>
      </footer>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e121a] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-white">Create New Workspace</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Configure your isolated container environment.
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
                    placeholder="e.g. data-structures, express-api"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Runtime Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'javascript', label: 'JavaScript (Node.js)' },
                        { id: 'typescript', label: 'TypeScript 5' },
                        { id: 'python', label: 'Python 3' },
                        { id: 'html', label: 'HTML5 Web' },
                      ] as const
                    ).map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs text-left transition-all ${
                          language === lang.id
                            ? 'bg-sky-500/15 border-sky-400 text-white font-semibold shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Starter Template
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    className="w-full bg-[#07090e] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
                  >
                    <option value="starter">Starter Playground (Recommended)</option>
                    <option value="algorithms">Algorithms & Data Structures</option>
                    <option value="express">Express REST API Template</option>
                    <option value="empty">Blank Workspace</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-slate-300 hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/25 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create & Launch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
