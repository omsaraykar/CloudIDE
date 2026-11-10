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

  const isFullUrl = previewPath.startsWith('http://') || previewPath.startsWith('https://');
  const isPortOnly = /^:?\d{4,5}/.test(previewPath);

  let iframeSrc = '';
  let displayPrefix = 'http://localhost:4000/';

  if (isFullUrl) {
    iframeSrc = previewPath;
    displayPrefix = '';
  } else if (isPortOnly) {
    const port = previewPath.replace(/^:/, '');
    iframeSrc = `http://localhost:${port}/`;
    displayPrefix = '';
  } else {
    const currentPath = previewPath.startsWith('/') ? previewPath.slice(1) : previewPath;
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    iframeSrc = `${backendBase}/api/workspaces/${workspace.id}/preview/${currentPath}?t=${previewRefreshKey}`;
  }

  const handleRefresh = () => {
    setIsRotating(true);
    refreshPreview();
    setTimeout(() => setIsRotating(false), 500);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = inputUrl.trim();
    if (cleaned === '5173' || cleaned === ':5173') {
      cleaned = 'http://localhost:5173/';
    } else if (!cleaned.startsWith('http') && /^\d{4,5}/.test(cleaned)) {
      cleaned = `http://localhost:${cleaned}/`;
    } else if (!cleaned.startsWith('http') && cleaned.startsWith('/')) {
      cleaned = cleaned.slice(1);
    }
    setPreviewPath(cleaned || 'index.html');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#09090b] border-l border-white/[0.08] text-zinc-300 overflow-hidden select-none">
      {/* Browser Chrome Header */}
      <div className="h-[38px] px-2.5 flex items-center justify-between border-b border-white/[0.08] bg-[#0c0c0e] gap-2">
        {/* Navigation / Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="Reload Preview"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Browser Address Bar */}
        <form
          onSubmit={handleUrlSubmit}
          className="flex-1 max-w-[420px] flex items-center gap-1.5 px-2.5 py-1 bg-[#141418] border border-white/[0.08] hover:border-white/[0.14] focus-within:border-zinc-500 rounded-md transition-colors"
        >
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          {displayPrefix ? (
            <span className="text-[10px] text-zinc-500 select-none font-mono shrink-0">{displayPrefix}</span>
          ) : null}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:5173 or index.html"
            className="flex-1 bg-transparent text-[11px] font-mono text-zinc-200 outline-none truncate"
          />
        </form>

        {/* Exactly 2 options: Desktop View and Open in New Tab Button */}
        <div className="flex items-center gap-1.5">
          {/* Option 1: Desktop View */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-medium"
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Desktop</span>
          </div>

          {/* Option 2: Open in New Tab */}
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/[0.08] bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors text-[11px] font-medium"
            title="Open Live Preview in New Window Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Open in Tab</span>
          </a>

          {/* Close Panel */}
          <button
            onClick={togglePreview}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-rose-400 transition-colors ml-1"
            title="Close Browser Preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Viewport Area */}
      <div className="flex-1 w-full h-full bg-[#09090b] flex items-center justify-center p-0 overflow-hidden relative">
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
  );
}
