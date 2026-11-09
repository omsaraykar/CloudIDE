'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Terminal,
  Play,
  ArrowRight,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Zap,
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
    // Check if user previously logged in
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
                Playground
              </span>
            </span>
          </Link>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus.dockerAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-400">
              Container Runtime:{' '}
              <strong className="text-white">
                {systemStatus.dockerAvailable ? 'Docker Engine Ready' : 'Sandbox Ready'}
              </strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center gap-8 relative z-10 text-center">
        {/* Shimmering Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-300 backdrop-blur-md shadow-inner"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
          <span>Cloud Developer Playground</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-sky-400 font-semibold">1 Dedicated Linux Container</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-2xl leading-[1.1]"
        >
          Your Instant, Isolated{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
            Developer Sandbox
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed"
        >
          Log in with your username to enter an empty playground with your dedicated container, real Bash terminal, and Monaco Editor. Install any packages and dependencies with full root permissions.
        </motion.p>

        {/* Developer Login & Container Playground Launch Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md p-6 rounded-2xl bg-[#0c1017]/90 border border-white/[0.1] shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-left relative overflow-hidden"
        >
          {/* Ambient subtle glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Developer Access</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              1 User = 1 Container
            </span>
          </div>

          <form onSubmit={handleEnterPlayground} className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Enter your developer handle / name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. bolt, alex, dev"
                required
                className="w-full bg-[#05070a] border border-white/[0.1] focus:border-sky-400/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-semibold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Spinning Up Container...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Playground</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Core Playground Highlights */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sky-400" />
              <span>Dedicated Container</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Root Permissions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Bash Linux Shell</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-purple-400" />
              <span>Clean Empty Workspace</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
