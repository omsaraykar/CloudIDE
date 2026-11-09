'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Terminal,
  ArrowRight,
  Sparkles,
  Layers,
  Code2,
  Globe,
  ShieldCheck,
  Cpu,
  Boxes,
} from 'lucide-react';
import { api } from '../lib/api';

const HeroCanvas3D = dynamic(
  () => import('../components/landing/HeroCanvas3D').then((m) => m.HeroCanvas3D),
  { ssr: false }
);

export default function WelcomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{ dockerAvailable: boolean; platform: string }>({
    dockerAvailable: false,
    platform: 'unknown',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cloudide_user');
    if (saved) {
      setUsername(saved);
    }
    api.getSystemStatus().then(setSystemStatus).catch(console.error);
  }, []);

  const handleEnterPlayground = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'developer';

    try {
      setIsSubmitting(true);
      localStorage.setItem('cloudide_user', clean);
      const ws = await api.enterPlayground(clean);
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      console.error('Failed to enter playground:', err);
      alert('Failed to enter playground. Make sure the backend server and Docker are running.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-x-hidden selection:bg-sky-500/20 selection:text-sky-200">
      {/* 3D Particle Canvas Background */}
      <div className="opacity-60 pointer-events-none">
        <HeroCanvas3D />
      </div>

      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"
      />

      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.12] flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm group-hover:border-sky-500/50 transition-colors">
              <span className="text-sky-400 font-semibold">&gt;_</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              CloudIDE
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-400 font-normal">
                v2.0
              </span>
            </span>
          </Link>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemStatus.dockerAvailable ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-sky-400'
              }`}
            />
            <span className="text-[11px] font-mono text-zinc-400">
              {systemStatus.dockerAvailable ? 'Docker Engine Connected' : 'Engine Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 md:py-24 flex flex-col items-center justify-center gap-10 relative z-10 text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/[0.1] text-[11px] font-medium text-zinc-300 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Next-Generation Cloud Developer Sandbox</span>
        </motion.div>

        {/* Hero Title & Subtitle */}
        <div className="flex flex-col items-center gap-4 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]"
          >
            Instant cloud playground <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500">
              for modern developers.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed"
          >
            Launch an isolated environment in seconds with root Bash terminal access, Monaco Editor, and instant live web preview.
          </motion.p>
        </div>

        {/* Linear/Raycast Style Launch Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md p-5 rounded-2xl bg-[#0c0c0e]/95 border border-white/[0.1] shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-left relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              Developer Login
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">root / bash</span>
          </div>

          <form onSubmit={handleEnterPlayground} className="flex flex-col gap-3">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs text-zinc-500 font-mono select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full bg-[#141418] border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Environment...</span>
                </>
              ) : (
                <>
                  <span>Enter Playground</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Specs */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              Isolated Sandbox
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              Root Shell
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              HTML Preview
            </span>
          </div>
        </motion.div>

        {/* Minimalist IDE Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="w-full max-w-4xl mt-4 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl overflow-hidden text-left font-mono"
        >
          {/* Mock Window Header */}
          <div className="h-9 px-4 bg-[#121215] border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-[11px] text-zinc-500 ml-2">cloudide · workspace</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-zinc-500">bash</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> connected
              </span>
            </div>
          </div>

          {/* Mock Editor + Terminal split */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] text-xs">
            {/* Explorer snippet */}
            <div className="p-3 bg-[#0c0c0e] text-zinc-400 space-y-1.5 hidden md:block">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">EXPLORER</div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>index.html</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>app.js</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>styles.css</span>
              </div>
            </div>

            {/* Code lines */}
            <div className="p-4 bg-[#09090b] col-span-2 space-y-1 text-zinc-300 leading-relaxed overflow-x-auto">
              <div className="flex items-center gap-4 text-zinc-600">
                <span className="w-4 select-none">1</span>
                <span className="text-zinc-200">&lt;<span className="text-sky-400">html</span> <span className="text-amber-400">lang</span>=<span className="text-emerald-400">&quot;en&quot;</span>&gt;</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-600">
                <span className="w-4 select-none">2</span>
                <span className="text-zinc-200 pl-4">&lt;<span className="text-sky-400">h1</span>&gt;<span className="text-zinc-100">Hello from CloudIDE!</span>&lt;/<span className="text-sky-400">h1</span>&gt;</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-600">
                <span className="w-4 select-none">3</span>
                <span className="text-zinc-200">&lt;/<span className="text-sky-400">html</span>&gt;</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400 flex items-center gap-2">
                <span className="text-sky-400">cloudide:~#</span>
                <span className="text-zinc-300">apk add nodejs python3</span>
                <span className="w-2 h-3.5 bg-zinc-400 animate-pulse inline-block ml-1" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
