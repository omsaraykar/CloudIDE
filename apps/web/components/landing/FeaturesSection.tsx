'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Terminal,
  Zap,
  RefreshCw,
  Database,
  Lock,
  Cpu,
  Layers,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Boxes,
    title: 'Containerized Sandbox',
    description:
      'Isolated Docker containers with non-root execution, 256MB memory caps, CPU quotas, and process limits for safe code execution.',
    badge: 'Dockerode Engine',
    color: 'from-sky-500/20 to-blue-600/10',
    iconColor: 'text-sky-400',
  },
  {
    icon: Terminal,
    title: 'Real-time xterm.js Terminal',
    description:
      'Full duplex interactive terminal sessions streamed over Socket.IO with ANSI color rendering, resize fitting, and bash/sh shell access.',
    badge: 'WebSocket PTY',
    color: 'from-emerald-500/20 to-teal-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Monaco Editor Experience',
    description:
      'The same editor engine powering VS Code: syntax highlighting, multiple tabs, minimap, intellisense, and debounced autosave.',
    badge: 'Monaco Core',
    color: 'from-amber-500/20 to-orange-600/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: RefreshCw,
    title: 'Instant Filesystem Sync',
    description:
      'Chokidar watcher monitors the workspace filesystem in real time; terminal file operations update the UI explorer without page reloads.',
    badge: 'Chokidar Sync',
    color: 'from-indigo-500/20 to-purple-600/10',
    iconColor: 'text-indigo-400',
  },
  {
    icon: Database,
    title: 'PostgreSQL & Prisma Persistence',
    description:
      'Workspaces, metadata, and execution histories persist safely in PostgreSQL via Prisma ORM, with local volume mount persistence.',
    badge: 'PostgreSQL 16',
    color: 'from-purple-500/20 to-pink-600/10',
    iconColor: 'text-purple-400',
  },
  {
    icon: Lock,
    title: 'Untrusted Code Security',
    description:
      'Path traversal protection, process isolation, execution timeouts (15s limit), and automatic sandbox fallback if Docker is offline.',
    badge: 'Zero-Trust Sandbox',
    color: 'from-rose-500/20 to-red-600/10',
    iconColor: 'text-rose-400',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 relative">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-sky-400 mb-3"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>PRODUCTION-GRADE ARCHITECTURE</span>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3"
        >
          Engineered for speed, isolation, and developer happiness.
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-sm text-slate-400 leading-relaxed"
        >
          Not a static frontend mockup — CloudIDE runs real backend processes,
          real Docker containers, and real interactive terminals.
        </motion.p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-[#0c1017]/80 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.15] transition-all relative group overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400">
                      {feature.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
