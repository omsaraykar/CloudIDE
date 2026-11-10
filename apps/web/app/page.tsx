'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Terminal,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2,
  ArrowRight,
  Laptop,
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

  const handleEnterPlayground = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    <div className="min-h-screen bg-[#07050d] text-white flex flex-col relative font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Fixed 3D Gravity Spheres Canvas Background & CSS Post-Processing Layering */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft violet & purple radial bloom under canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_75%,rgba(139,92,246,0.22),transparent_70%)]" />
        <HeroCanvas3D />
        {/* Film grain texture to hide gradient banding and add tactile depth */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'.8\' numOctaves=\'2\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          }}
        />
        {/* Center vignette framing */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6))]" />
      </div>

      {/* Ambient Top Glows */}
      <div className="fixed -top-32 -left-32 w-[650px] h-[650px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-10 right-0 w-[450px] h-[450px] bg-indigo-900/15 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Fixed Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-20 px-8 md:px-16 flex items-center justify-between z-40 bg-transparent select-none">
        {/* Brand Wordmark */}
        <Link href="#home" className="text-lg font-bold tracking-tight text-white hover:opacity-85 transition-opacity">
          CloudIDE
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-300">
          <Link href="#home" className="hover:text-white transition-colors">
            Overview
          </Link>
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
        </nav>

        {/* Right Auth / Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEnterPlayground()}
            className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] backdrop-blur-sm transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => handleEnterPlayground()}
            className="text-xs font-semibold text-zinc-950 px-5 py-2 rounded-full bg-white hover:bg-zinc-100 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch IDE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col pt-20">
        {/* SECTION 1: HERO */}
        <section id="home" className="min-h-screen flex flex-col items-center justify-start text-center px-6 pt-16 md:pt-24 pb-12 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#150e26]/80 border border-purple-500/30 text-purple-300 text-xs font-medium mb-5 backdrop-blur-md shadow-lg"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Ephemeral Docker Micro-Containers</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.06] max-w-3xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
          >
            Elevate Your <br />
            Coding Experience
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-lg mt-4 leading-relaxed font-light drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]"
          >
            Unlock your development potential in a fully isolated environment, powered by dedicated containers.
          </motion.p>

          {/* Quick Feature Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mt-5 text-[11px] text-zinc-200 font-mono"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0a1a]/85 border border-white/[0.12] backdrop-blur-md shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-200 font-medium">&lt; 150ms Boot</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0a1a]/85 border border-white/[0.12] backdrop-blur-md shadow-lg">
              <Terminal className="w-3 h-3 text-purple-400" />
              <span className="text-zinc-200 font-medium">PTY Shell</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e0a1a]/85 border border-white/[0.12] backdrop-blur-md shadow-lg">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span className="text-zinc-200 font-medium">Kernel Sandboxed</span>
            </div>
          </motion.div>

          {/* Center Capsule CTA Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-7 relative z-30 w-full max-w-sm"
          >
            <form onSubmit={handleEnterPlayground} className="flex items-center justify-center">
              <div className="flex items-center gap-2 p-1.5 bg-[#100b1e]/95 backdrop-blur-xl border border-white/[0.16] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.8)] hover:border-purple-500/50 transition-all w-full">
                <span className="text-xs text-purple-300 font-mono pl-3.5 select-none font-semibold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="developer"
                  className="bg-transparent text-xs text-white placeholder-zinc-400 outline-none flex-1 min-w-0 font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs px-6 py-2.5 rounded-full transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>Sign Up & Code</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Scroll Cue */}
          <div className="mt-8 flex flex-col items-center gap-1 text-zinc-400 text-xs font-mono select-none px-3.5 py-1 rounded-full bg-[#07050d]/80 backdrop-blur-md border border-white/[0.08] shadow-md">
            <span className="uppercase tracking-widest text-[9px] text-zinc-400 font-medium">Scroll to explore</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-purple-400" />
          </div>
        </section>

        {/* SECTION 2: FEATURES & WORKFLOW */}
        <section id="features" className="min-h-screen py-24 px-6 md:px-16 max-w-6xl mx-auto w-full flex flex-col justify-center relative z-20">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              [ 01 — Developer Experience ]
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              Built for velocity. <br />
              Engineered for developers.
            </h2>
            <p className="text-zinc-200 text-sm leading-relaxed font-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] max-w-xl">
              Skip hours of local environment setup, version conflicts, and missing compiler flags. CloudIDE equips you with a turnkey workstation in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-[#0c0818]/90 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Full Linux Root Privileges</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-light">
                Install custom dev tools, compilers, databases, and dependencies directly inside your container shell. Use apt, npm, or curl with zero permission hurdles.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#0c0818]/90 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Persistent File System</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-light">
                Every line of code and package installation is synchronized to your dedicated storage volume. Return anytime from any browser and pick up where you left off.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#0c0818]/90 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-violet-500/15 text-violet-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Instant One-Click Execution</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-light">
                Execute code scripts with a dedicated execution button, streaming process standard output, stderr, and execution benchmarks directly into the UI panel.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#0c0818]/90 border border-white/[0.12] backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-pink-500/15 text-pink-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Device Agnostic Access</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-light">
                Code on a Chromebook, iPad, low-powered ultrabook, or high-end workstation. Heavy builds, compilations, and tests execute in the container, not on your battery.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: FOOTER & STATUS */}
        <footer className="border-t border-white/[0.08] bg-[#050309]/80 backdrop-blur-xl py-16 px-6 md:px-16 relative z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="text-lg font-bold tracking-tight text-white">
                CloudIDE
              </div>
              <p className="text-xs text-zinc-500 font-light">
                © 2026 CloudIDE Digital Systems. All rights reserved.
              </p>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus.dockerAvailable ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus.dockerAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="text-zinc-400">Docker Engine:</span>
              <span className={systemStatus.dockerAvailable ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {systemStatus.dockerAvailable ? 'Active' : 'Standby'}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Platform:</span>
              <span className="text-zinc-300 font-semibold">{systemStatus.platform}</span>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 text-xs text-zinc-400">
              <Link href="#home" className="hover:text-white transition-colors">
                Top
              </Link>
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
