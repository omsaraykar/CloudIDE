'use client';

import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  X,
  Monitor,
  Lock,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export function BrowserPreview() {
  const {
    workspace,
    previewPath,
    previewRefreshKey,
    refreshPreview,
    setPreviewPath,
    togglePreview,
  } = useWorkspaceStore();

  const [isRotating, setIsRotating] = useState(false);
  const [inputUrl, setInputUrl] = useState(previewPath);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!workspace) return null;

  const currentPath = previewPath.startsWith('/') ? previewPath.slice(1) : previewPath;
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const previewUrl = `${backendBase}/api/workspaces/${workspace.id}/preview/${currentPath}`;
  const iframeSrc = `${previewUrl}?t=${previewRefreshKey}`;

  const handleRefresh = () => {
    setIsRotating(true);
    refreshPreview();
    setTimeout(() => setIsRotating(false), 500);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = inputUrl.trim();
    if (cleaned.startsWith('/')) cleaned = cleaned.slice(1);
    setPreviewPath(cleaned || 'index.html');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0e14] border-l border-ide-border text-slate-300 overflow-hidden select-none">
      {/* Browser Chrome Header */}
      <div className="h-9 px-2.5 flex items-center justify-between border-b border-ide-border bg-[#0e131b] gap-2">
        {/* Navigation / Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            title="Reload Preview (Ctrl+R)"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Browser Address Bar */}
        <form
          onSubmit={handleUrlSubmit}
          className="flex-1 max-w-[460px] flex items-center gap-1.5 px-2.5 py-1 bg-[#05070a] border border-white/[0.08] hover:border-white/[0.15] focus-within:border-sky-500/50 rounded-md transition-colors"
        >
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-500 select-none font-mono">http://localhost:4000/.../</span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="index.html"
            className="flex-1 bg-transparent text-[11px] font-mono text-slate-200 outline-none truncate"
          />
        </form>

        {/* Exactly 2 options: Desktop View and Open in New Tab Button */}
        <div className="flex items-center gap-1.5">
          {/* Option 1: Desktop View */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-medium"
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Desktop View</span>
          </div>

          {/* Option 2: Open in New Tab */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.08] bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
            title="Open Live Preview in New Window Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Open in New Tab</span>
          </a>

          {/* Close Panel */}
          <button
            onClick={togglePreview}
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-rose-400 transition-colors ml-1"
            title="Close Browser Preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Viewport Area */}
      <div className="flex-1 w-full h-full bg-[#07090e] flex items-center justify-center p-0 overflow-hidden relative">
        <div className="relative bg-white w-full h-full flex flex-col">
          <iframe
            ref={iframeRef}
            key={previewRefreshKey}
            src={iframeSrc}
            title="Live Workspace Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
