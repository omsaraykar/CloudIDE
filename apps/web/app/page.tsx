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
  Cpu,
  Layers,
  Lock,
  Server,
  CheckCircle2,
  ArrowRight,
  Code2,
  Boxes,
  HelpCircle,
  ExternalLink,
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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
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

  const faqs = [
    {
      q: 'How is CloudIDE different from iframe-based playgrounds?',
      a: 'Unlike front-end browser mock sandboxes, CloudIDE provisions genuine, isolated root Linux Docker containers for every session. You get a real Linux kernel, full file system access, and persistent volume mounts.',
    },
    {
      q: 'Which programming runtimes are pre-installed?',
      a: 'Workspaces come pre-configured with Node.js v24, Python 3, npm, pnpm, Git, and essential build toolchains. You can also install any custom package via apt or npm inside your container root terminal.',
    },
    {
      q: 'How does the terminal achieve zero-latency performance?',
      a: 'CloudIDE connects xterm.js directly to native container pseudo-terminals (PTY) through low-latency WebSockets. Key events and ANSI escape sequences stream at 60fps with zero buffer lag.',
    },
    {
      q: 'Are my project files preserved across reloads?',
      a: 'Yes. Workspace directories are mounted to isolated Docker volumes tied to your username. Your changes, dependencies, and git repositories remain intact when you return.',
    },
  ];

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
      <header className="fixed top-0 left-0 right-0 h-20 px-8 md:px-16 flex items-center justify-between z-40 backdrop-blur-md bg-[#07050d]/60 border-b border-white/[0.06] select-none">
        {/* Brand Logo */}
        <Link href="#home" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span>CloudIDE</span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-300">
          <Link href="#home" className="hover:text-white transition-colors">
            Overview
          </Link>
          <Link href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </Link>
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#security" className="hover:text-white transition-colors">
            Security
          </Link>
          <Link href="#faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Right Auth / Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleEnterPlayground()}
            className="text-xs font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.12] transition-all cursor-pointer"
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
        <section id="home" className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6 backdrop-blur-sm"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Ephemeral Docker Micro-Containers</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.06] max-w-3xl"
          >
            Elevate Your <br />
            Coding Experience
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-lg mt-5 leading-relaxed font-light"
          >
            Unlock your development potential in a fully isolated environment, powered by dedicated containers.
          </motion.p>

          {/* Quick Feature Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mt-5 text-[11px] text-zinc-300 font-mono"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>&lt; 150ms Boot</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <Terminal className="w-3 h-3 text-purple-400" />
              <span>PTY Shell</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Kernel Sandboxed</span>
            </div>
          </motion.div>

          {/* Center Capsule CTA Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-8 relative z-30 w-full max-w-sm"
          >
            <form onSubmit={handleEnterPlayground} className="flex items-center justify-center">
              <div className="flex items-center gap-2 p-1.5 bg-[#120d22]/90 backdrop-blur-xl border border-white/[0.14] rounded-full shadow-2xl hover:border-purple-500/40 transition-all w-full">
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

          {/* Scroll Cue */}
          <div className="mt-14 flex flex-col items-center gap-1.5 text-zinc-400 text-xs font-mono select-none">
            <span className="uppercase tracking-widest text-[10px] text-zinc-500">Scroll to explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-purple-400" />
          </div>
        </section>

        {/* SECTION 2: ARCHITECTURE & ENGINE */}
        <section id="architecture" className="min-h-screen py-24 px-6 md:px-16 max-w-6xl mx-auto w-full flex flex-col justify-center">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/[0.08] pb-10">
            <div>
              <div className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3">
                [ 01 — Runtime Architecture ]
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                When code runs with <br />
                true isolation.
              </h2>
            </div>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed font-light">
              As you scroll, notice the 3D physics field surrendering to gravity. Every workspace is built on a container-first architecture designed for zero friction and instant execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative p-8 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 transition-all hover:-translate-y-1 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">01 / Engine</div>
              <h3 className="text-xl font-bold text-white mb-2">Docker Micro-Containers</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light mb-6">
                Fastify orchestrates dedicated Docker containers with automated bind-mounted workspaces and strict memory quotas.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300">Boot Time</span>
                <span className="text-zinc-300 font-semibold">&lt; 150ms</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-8 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all hover:-translate-y-1 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">02 / Shell</div>
              <h3 className="text-xl font-bold text-white mb-2">WebSocket PTY Streams</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light mb-6">
                Direct bidirectional byte streaming via node-pty and xterm.js enables 60fps shell updates, full ANSI colors, and interactive CLI programs.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-300">Terminal Latency</span>
                <span className="text-zinc-300 font-semibold">&lt; 5ms</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-8 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/40 transition-all hover:-translate-y-1 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">03 / Editor</div>
              <h3 className="text-xl font-bold text-white mb-2">Monaco Code Core</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-light mb-6">
                Equipped with the same editor core powering VS Code, complete with syntax trees, intelligent autocomplete, and multi-file project tabs.
              </p>
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-violet-300">Editor Engine</span>
                <span className="text-zinc-300 font-semibold">VS Code Core</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FEATURES & WORKFLOW */}
        <section id="features" className="min-h-screen py-24 px-6 md:px-16 max-w-6xl mx-auto w-full flex flex-col justify-center">
          <div className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3">
            [ 02 — Developer Experience ]
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            Built for velocity. <br />
            Engineered for developers.
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mb-16 leading-relaxed font-light">
            Skip hours of local environment setup, version conflicts, and missing compiler flags. CloudIDE equips you with a turnkey workstation in seconds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Full Linux Root Privileges</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Install custom dev tools, compilers, databases, and dependencies directly inside your container shell. Use apt, npm, or curl with zero permission hurdles.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Persistent File System</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Every line of code and package installation is synchronized to your dedicated storage volume. Return anytime from any browser and pick up where you left off.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Instant One-Click Execution</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Execute code scripts with a dedicated execution button, streaming process standard output, stderr, and execution benchmarks directly into the UI panel.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Device Agnostic Access</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Code on a Chromebook, iPad, low-powered ultrabook, or high-end workstation. Heavy builds, compilations, and tests execute in the container, not on your battery.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: SECURITY & ISOLATION */}
        <section id="security" className="min-h-screen py-24 px-6 md:px-16 max-w-6xl mx-auto w-full flex flex-col justify-center">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-b from-[#140b28]/80 to-[#0c071a]/90 border border-purple-500/20 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3">
              [ 03 — Hardened Sandboxing ]
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
              Security at the kernel boundary.
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl mb-12 leading-relaxed font-light">
              Unlike shared VM multi-tenant hosting, CloudIDE enforces strict Linux namespace boundaries and cgroup limits for every container, ensuring zero noisy-neighbor interference.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Lock className="w-5 h-5 text-purple-400 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1.5">Namespace Isolation</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Process ID, Network, Mount, and IPC namespaces are fully compartmentalized per session.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Cpu className="w-5 h-5 text-indigo-400 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1.5">Cgroup Resource Caps</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Explicit memory limits, CPU quotas, and swap policies guarantee reliable deterministic host performance.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Server className="w-5 h-5 text-violet-400 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1.5">Automated Lifecycle</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Containers automatically hibernate when idle and spin down gracefully to prevent orphaned workloads.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ & INTERACTIVE ACCORDION */}
        <section id="faq" className="min-h-screen py-24 px-6 md:px-16 max-w-4xl mx-auto w-full flex flex-col justify-center">
          <div className="text-center mb-16">
            <div className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3">
              [ 04 — Knowledge Base ]
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto font-light">
              Everything you need to know about the CloudIDE container runtime and development workflows.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="p-6 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/30 transition-all cursor-pointer select-none"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                    <ChevronDown
                      className={`w-4 h-4 text-purple-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-light border-t border-white/[0.06] pt-4"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: FOOTER & STATUS */}
        <footer className="border-t border-white/[0.08] bg-[#050309]/80 backdrop-blur-xl py-16 px-6 md:px-16 relative z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Code2 className="w-5 h-5 text-purple-400" />
                <span>CloudIDE</span>
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
              <Link href="#architecture" className="hover:text-white transition-colors">
                Architecture
              </Link>
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
