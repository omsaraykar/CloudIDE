'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Code2, Play, Sparkles } from 'lucide-react';

// Dynamic import with SSR disabled for Monaco
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-ide-panel flex items-center justify-center text-xs text-ide-muted">
      Loading Monaco Editor...
    </div>
  ),
});

export function CodeEditor() {
  const {
    openFiles,
    activeFilePath,
    updateFileContent,
    saveCurrentFile,
    runCode,
  } = useWorkspaceStore();

  const editorRef = useRef<any>(null);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      updateFileContent(activeFilePath, value);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define custom charcoal theme
    monaco.editor.defineTheme('cloudide-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: 'a7f3d0' },
        { token: 'number', foreground: 'fcd34d' },
        { token: 'identifier', foreground: 'f1f5f9' },
      ],
      colors: {
        'editor.background': '#0f1319',
        'editor.foreground': '#f1f5f9',
        'editorCursor.foreground': '#38bdf8',
        'editor.lineHighlightBackground': '#181d26',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#2563eb40',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
      },
    });

    monaco.editor.setTheme('cloudide-dark');

    // Keybindings: Cmd+S or Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });

    // Keybindings: Cmd+Enter or Ctrl+Enter to Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  if (!activeFile) {
    return (
      <div className="h-full w-full bg-ide-panel flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-ide-subtle border border-ide-border flex items-center justify-center text-ide-accent mb-4 shadow-inner">
          <Code2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-ide-text mb-1">No File Open</h3>
        <p className="text-xs text-ide-muted max-w-sm mb-4">
          Select a file from the explorer on the left or create a new file to start coding.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-ide-muted/80 bg-ide-surface px-3 py-1.5 rounded border border-ide-border">
          <kbd className="px-1.5 py-0.5 rounded bg-ide-subtle text-ide-text font-mono border border-ide-border">Ctrl+Enter</kbd>
          <span>to Run</span>
          <span className="mx-1">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-ide-subtle text-ide-text font-mono border border-ide-border">Ctrl+S</kbd>
          <span>to Save</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0f1319] relative">
      <MonacoEditor
        height="100%"
        language={activeFile.language || 'javascript'}
        value={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="cloudide-dark"
        options={{
          minimap: { enabled: true, maxColumn: 80 },
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          padding: { top: 10, bottom: 10 },
        }}
      />
    </div>
  );
}
