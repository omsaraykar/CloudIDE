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
      <header className="fixed top-0 left-0 right-0 h-24 px-8 md:px-16 flex items-center justify-between z-40 bg-transparent select-none">
        {/* Wordmark */}
        <Link href="#home" className="text-xl md:text-2xl font-black tracking-[0.25em] text-white hover:opacity-80 transition-opacity uppercase font-mono">
          GRAVITY
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-10 text-xs md:text-sm font-medium text-zinc-300">
          <Link href="#works" className="hover:text-white transition-opacity opacity-80 hover:opacity-100">
            Works
          </Link>
          <Link href="#services" className="hover:text-white transition-opacity opacity-80 hover:opacity-100">
            Services
          </Link>
          <Link href="#team" className="hover:text-white transition-opacity opacity-80 hover:opacity-100">
            Team
          </Link>
          <Link href="#story" className="hover:text-white transition-opacity opacity-80 hover:opacity-100">
            Story
          </Link>
          <Link href="#contact" className="hover:text-white transition-opacity opacity-80 hover:opacity-100">
            Contact
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => handleEnterPlayground()}
            className="w-11 h-11 rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-xl shadow-lg flex items-center justify-center text-white hover:bg-white/[0.15] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Open studio controls"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="2" y1="14" x2="6" y2="14" />
              <line x1="10" y1="8" x2="14" y2="8" />
              <line x1="18" y1="16" x2="22" y2="16" />
            </svg>
          </button>
          <button
            onClick={() => handleEnterPlayground()}
            className="inline-flex items-center gap-4 pl-6 pr-1.5 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-lg text-sm font-medium text-white hover:border-purple-400/50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <span>Contact us</span>
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-500/40 flex items-center justify-center">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col">
        {/* SECTION 1: HERO */}
        <section
          id="home"
          className="min-h-screen flex items-end justify-between px-8 md:px-16 pb-14 md:pb-16 pt-28 max-w-7xl mx-auto w-full relative z-20 pointer-events-none"
        >
          <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pointer-events-auto">
            {/* Left Column */}
            <div className="flex flex-col items-start text-left">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-xs md:text-sm font-mono tracking-wider uppercase text-purple-400 mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                [ Digital studio ]
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.28 }}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-bold tracking-tight text-white leading-[0.98] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] whitespace-nowrap"
              >
                Less noise. More gravity.
              </motion.h1>
            </div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              className="w-full max-w-[280px] flex flex-col gap-6 text-left shrink-0"
            >
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                We design digital experiences that remove distraction and amplify presence.
              </p>
              <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                © 2026 — Independent digital agency
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono uppercase tracking-widest select-none">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 5v14m-7-7 7 7 7-7" />
                </svg>
                <span>Scroll</span>
              </div>
            </motion.div>
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
