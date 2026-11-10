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
  const [showLoginModal, setShowLoginModal] = useState(false);
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
    <div className="min-h-screen bg-[#07050d] text-white flex flex-col relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white">
      {/* 3D Gravity Spheres Canvas Background & CSS Post-Processing Layering */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft royal blue & indigo radial bloom under canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_80%,rgba(47,105,255,0.25),transparent_70%)]" />
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      {/* Ambient Top-Left Purple Glow (Matches reference image) */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Ambient Top-Right Indigo Glow */}
      <div className="absolute top-10 right-0 w-[450px] h-[450px] bg-indigo-900/15 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header className="h-20 px-8 md:px-16 flex items-center justify-between relative z-30 select-none">
        {/* Brand Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
          CloudIDE
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-300">
          <Link href="/" className="hover:text-white transition-colors">
            About
          </Link>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
            <span>Playground</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </div>
          <Link href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </Link>
          <Link href="#faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors text-zinc-400">
            <span>ENG</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </nav>

        {/* Right Auth / Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEnterPlayground()}
            className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.12] transition-all"
          >
            Login
          </button>
          <button
            onClick={() => handleEnterPlayground()}
            className="text-xs font-semibold text-zinc-950 px-5 py-2 rounded-full bg-white hover:bg-zinc-100 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Sign up
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-16 md:pt-24 pb-24 flex flex-col items-center justify-start text-center relative z-20">
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.06] max-w-3xl"
          >
            Elevate Your <br />
            Coding Experience
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-lg mt-5 leading-relaxed font-light"
          >
            Unlock your development potential in a fully isolated environment, powered by dedicated containers.
          </motion.p>

          {/* Center Capsule CTA (Exact White Pill Button from Reference) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 relative z-30"
          >
            <form onSubmit={handleEnterPlayground} className="flex items-center justify-center">
              <div className="flex items-center gap-2 p-1.5 bg-[#120d22] border border-white/[0.14] rounded-full shadow-2xl hover:border-purple-500/40 transition-all max-w-sm w-full">
                <span className="text-xs text-purple-300/80 font-mono pl-3.5 select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="developer"
                  className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none flex-1 min-w-0 font-mono"
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
        </div>
      </main>
    </div>
  );
}
