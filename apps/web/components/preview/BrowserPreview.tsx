'use client';

import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Lock,
  FileCode,
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
    createNode,
  } = useWorkspaceStore();

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
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

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px] h-[92%] shadow-2xl rounded-2xl border border-white/10 my-auto';
      case 'tablet':
        return 'w-[768px] h-[95%] shadow-2xl rounded-xl border border-white/10 my-auto';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  const handleCreateStarterHtml = async () => {
    await createNode(
      'index.html',
      'file',
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudIDE Web Project</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e293b, #0f172a);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.2rem;
      margin: 0 0 12px;
      background: linear-gradient(to right, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      max-width: 480px;
      line-height: 1.6;
    }
    button {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 16px;
      transition: background 0.2s;
    }
    button:hover {
      background: #0369a1;
    }
  </style>
</head>
<body>
  <div class="badge">LIVE BROWSER PREVIEW</div>
  <h1>CloudIDE Web Application</h1>
  <p>Edit this HTML file in Monaco Editor. Saves will live-reload right here!</p>
  <button onclick="alert('Hello from CloudIDE Interactive Preview!')">Click Me</button>
</body>
</html>`
    );
    setPreviewPath('index.html');
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

        {/* Viewport & External Actions */}
        <div className="flex items-center gap-1">
          {/* Device Size Switchers */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-md border border-white/[0.06]">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1 rounded ${
                deviceMode === 'desktop' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1 rounded ${
                deviceMode === 'tablet' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded ${
                deviceMode === 'mobile' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* Open in New Window Tab */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            title="Open Live Preview in New Window Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Close Panel */}
          <button
            onClick={togglePreview}
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-rose-400 transition-colors"
            title="Close Browser Preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Viewport Area */}
      <div className="flex-1 w-full h-full bg-[#07090e] flex items-center justify-center p-0 overflow-hidden relative">
        <div className={`relative bg-white transition-all duration-300 flex flex-col ${getDeviceWidth()}`}>
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
