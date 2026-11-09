'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getSocket } from '../../lib/socket';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export function XtermTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const { workspace } = useWorkspaceStore();

  useEffect(() => {
    if (!terminalRef.current || !workspace) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      cursorWidth: 2,
      fontSize: 13,
      lineHeight: 1.25,
      letterSpacing: 0,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace",
      theme: {
        background: '#09090b',
        foreground: '#f4f4f5',
        cursor: '#38bdf8',
        cursorAccent: '#09090b',
        selectionBackground: 'rgba(56, 189, 248, 0.25)',
        black: '#18181b',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#f4f4f5',
        brightBlack: '#52525b',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#eab308',
        brightBlue: '#38bdf8',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    termInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    const socket = getSocket();

    // Request new terminal session from server
    socket.emit('terminal:create', {
      workspaceId: workspace.id,
      cols: term.cols,
      rows: term.rows,
    });

    const onCreated = ({ sessionId }: { sessionId: string }) => {
      sessionIdRef.current = sessionId;
      console.log('[Xterm] Session initialized:', sessionId);
    };

    const onData = ({ sessionId, data }: { sessionId: string; data: string }) => {
      if (sessionIdRef.current === sessionId) {
        term.write(data);
      }
    };

    const onExit = ({ sessionId, exitCode }: { sessionId: string; exitCode: number }) => {
      if (sessionIdRef.current === sessionId) {
        term.write(`\r\n\x1b[33m[Session terminated with code ${exitCode}]\x1b[0m\r\n`);
      }
    };

    const onError = ({ error }: { error: string }) => {
      term.write(`\r\n\x1b[31m[Terminal Error: ${error}]\x1b[0m\r\n`);
    };

    socket.on('terminal:created', onCreated);
    socket.on('terminal:data', onData);
    socket.on('terminal:exit', onExit);
    socket.on('terminal:error', onError);

    // Send user keystrokes to server
    const dataDisposable = term.onData((data) => {
      if (sessionIdRef.current) {
        socket.emit('terminal:input', {
          sessionId: sessionIdRef.current,
          data,
        });
      }
    });

    // Resize listener
    const handleResize = () => {
      try {
        fitAddon.fit();
        if (sessionIdRef.current) {
          socket.emit('terminal:resize', {
            sessionId: sessionIdRef.current,
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (err) {
        // ignore layout resize quirks
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      dataDisposable.dispose();
      socket.off('terminal:created', onCreated);
      socket.off('terminal:data', onData);
      socket.off('terminal:exit', onExit);
      socket.off('terminal:error', onError);

      if (sessionIdRef.current) {
        socket.emit('terminal:close', sessionIdRef.current);
      }
      term.dispose();
    };
  }, [workspace]);

  return (
    <div className="h-full w-full bg-[#09090b] px-3.5 py-2.5 overflow-hidden flex flex-col">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
