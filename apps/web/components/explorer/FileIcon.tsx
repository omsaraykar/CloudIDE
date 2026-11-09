import React from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  File,
} from 'lucide-react';

interface FileIconProps {
  name: string;
  type: 'file' | 'directory';
  isOpen?: boolean;
  className?: string;
}

export function FileIcon({ name, type, isOpen = false, className = 'w-4 h-4' }: FileIconProps) {
  if (type === 'directory') {
    return isOpen ? (
      <FolderOpen className={`${className} text-sky-400`} />
    ) : (
      <Folder className={`${className} text-sky-400/80`} />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'js':
    case 'cjs':
    case 'mjs':
      return <span className="text-yellow-400 font-bold text-[10px] w-4 text-center">JS</span>;
    case 'ts':
    case 'tsx':
      return <span className="text-blue-400 font-bold text-[10px] w-4 text-center">TS</span>;
    case 'jsx':
      return <span className="text-cyan-400 font-bold text-[10px] w-4 text-center">⚛</span>;
    case 'json':
      return <FileJson className={`${className} text-amber-300`} />;
    case 'html':
    case 'htm':
      return <span className="text-orange-400 font-bold text-[10px] w-4 text-center">&lt;&gt;</span>;
    case 'css':
    case 'scss':
      return <span className="text-blue-300 font-bold text-[10px] w-4 text-center">#</span>;
    case 'md':
      return <FileText className={`${className} text-neutral-300`} />;
    case 'py':
      return <span className="text-yellow-300 font-bold text-[10px] w-4 text-center">Py</span>;
    case 'sh':
      return <span className="text-emerald-400 font-bold text-[10px] w-4 text-center">&gt;_</span>;
    default:
      return <File className={`${className} text-neutral-400`} />;
  }
}
