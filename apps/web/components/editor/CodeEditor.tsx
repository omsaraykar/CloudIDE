'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Code2 } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#121215] flex items-center justify-center text-xs text-zinc-500 font-mono">
      Loading Editor...
    </div>
  ),
});

export function CodeEditor() {
  const {
    openFiles,
    activeFilePath,
    updateFileContent,
    saveCurrentFile,
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

    // Define sleek modern obsidian theme
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
        'editor.background': '#121215',
        'editor.foreground': '#f4f4f5',
        'editorCursor.foreground': '#38bdf8',
        'editor.lineHighlightBackground': '#18181c',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#e4e4e7',
        'editor.selectionBackground': '#2563eb33',
        'editorIndentGuide.background': '#1f1f23',
        'editorIndentGuide.activeBackground': '#2e2e34',
      },
    });

    monaco.editor.setTheme('cloudide-dark');

    // Keybindings: Cmd+S or Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });
  };

  if (!activeFile) {
    return (
      <div className="h-full w-full bg-[#121215] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
          <Code2 className="w-5 h-5 text-zinc-300" />
        </div>
        <h3 className="text-xs font-semibold text-zinc-200 mb-1">No File Open</h3>
        <p className="text-[11px] text-zinc-500 max-w-xs mb-4 leading-relaxed">
          Select a file from the explorer on the left or create a new one to start writing code.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-white/[0.03] px-3 py-1.5 rounded-md border border-white/[0.06] font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-200 border border-white/[0.08]">Ctrl+S</kbd>
          <span>Save</span>
          <span className="text-zinc-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-200 border border-white/[0.08]">Ctrl+`</kbd>
          <span>Terminal</span>
          <span className="text-zinc-600">•</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-200 border border-white/[0.08]">Ctrl+B</kbd>
          <span>Sidebar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#121215] relative">
      <MonacoEditor
        height="100%"
        language={activeFile.language || 'plaintext'}
        value={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace",
          lineNumbers: 'on',
          lineHeight: 20,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
