'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type { FileNode } from '@cloud-ide/shared';
import { FileIcon } from './FileIcon';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface FileTreeNodeProps {
  node: FileNode;
  depth?: number;
}

export function FileTreeNode({ node, depth = 0 }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const {
    activeFilePath,
    openFile,
    renameNode,
    deleteNode,
  } = useWorkspaceStore();

  const isDirectory = node.type === 'directory';
  const isActive = activeFilePath === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(node.path);
    }
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(node.name);
    setIsEditing(true);
  };

  const handleConfirmRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim() || editName === node.name) {
      setIsEditing(false);
      return;
    }

    const pathSegments = node.path.split('/');
    pathSegments[pathSegments.length - 1] = editName.trim();
    const newPath = pathSegments.join('/');

    try {
      await renameNode(node.path, newPath);
    } catch (err) {
      console.error('Rename failed', err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelRename = () => {
    setEditName(node.name);
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      try {
        await deleteNode(node.path);
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  return (
    <div className="select-none text-xs">
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1 pr-2 rounded cursor-pointer transition-colors ${
          isActive
            ? 'bg-ide-active text-ide-accent font-medium'
            : 'text-ide-text hover:bg-ide-subtle hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDirectory ? (
            <span className="text-ide-muted hover:text-white">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          <FileIcon name={node.name} type={node.type} isOpen={isOpen} />

          {isEditing ? (
            <form onSubmit={handleConfirmRename} className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="bg-ide-panel border border-ide-accent rounded px-1 py-0.5 text-xs text-white focus:outline-none w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelRename();
                }}
              />
              <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5">
                <Check className="w-3 h-3" />
              </button>
              <button type="button" onClick={handleCancelRename} className="text-rose-400 hover:text-rose-300 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <span className="truncate" title={node.name}>
              {node.name}
            </span>
          )}
        </div>

        {/* Hover Actions */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={handleStartRename}
              className="p-1 rounded hover:bg-ide-panel text-ide-muted hover:text-white"
              title="Rename"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-ide-panel text-ide-muted hover:text-rose-400"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Directory Children */}
      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id || child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
