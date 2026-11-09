import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import type { FileNode, FileType, FileSystemChangeEvent } from '@cloud-ide/shared';

export class FilesystemService {
  private watchers = new Map<string, FSWatcher>();
  private onFileChangeListeners: ((event: FileSystemChangeEvent) => void)[] = [];

  constructor() {}

  public onFileChange(listener: (event: FileSystemChangeEvent) => void): void {
    this.onFileChangeListeners.push(listener);
  }

  /**
   * Sanitizes and verifies that a relative path stays inside the workspace root.
   */
  public resolveSafePath(workspaceRoot: string, relativePath: string): string {
    const resolved = path.resolve(workspaceRoot, relativePath);
    if (!resolved.startsWith(path.resolve(workspaceRoot))) {
      throw new Error('Access denied: Path traversal detected');
    }
    return resolved;
  }

  /**
   * Generates the hierarchical tree of files and directories.
   */
  public async getTree(workspaceRoot: string, currentRel = ''): Promise<FileNode[]> {
    const safeCurrent = this.resolveSafePath(workspaceRoot, currentRel);
    
    try {
      const entries = await fs.readdir(safeCurrent, { withFileTypes: true });
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        // Skip hidden git / node_modules to avoid tree pollution
        if (entry.name === '.git' || entry.name === 'node_modules') {
          continue;
        }

        const itemRelPath = path.posix.join(
          currentRel.replace(/\\/g, '/'),
          entry.name
        );
        const itemFullPath = path.join(safeCurrent, entry.name);

        if (entry.isDirectory()) {
          const children = await this.getTree(workspaceRoot, itemRelPath);
          nodes.push({
            id: itemRelPath,
            name: entry.name,
            path: itemRelPath,
            type: 'directory',
            children,
          });
        } else if (entry.isFile()) {
          const stat = await fs.stat(itemFullPath);
          const ext = path.extname(entry.name).slice(1);
          nodes.push({
            id: itemRelPath,
            name: entry.name,
            path: itemRelPath,
            type: 'file',
            size: stat.size,
            extension: ext,
            updatedAt: stat.mtime.toISOString(),
          });
        }
      }

      // Sort: folders first, then alphabetical
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (err) {
      console.error(`[FS] Error reading directory ${safeCurrent}:`, err);
      return [];
    }
  }

  public async readFile(workspaceRoot: string, relativePath: string): Promise<string> {
    const safePath = this.resolveSafePath(workspaceRoot, relativePath);
    return await fs.readFile(safePath, 'utf-8');
  }

  public async writeFile(workspaceRoot: string, relativePath: string, content: string): Promise<void> {
    const safePath = this.resolveSafePath(workspaceRoot, relativePath);
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, content, 'utf-8');
  }

  public async createNode(workspaceRoot: string, relativePath: string, type: FileType, content = ''): Promise<void> {
    const safePath = this.resolveSafePath(workspaceRoot, relativePath);
    if (type === 'directory') {
      await fs.mkdir(safePath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content, 'utf-8');
    }
  }

  public async renameNode(workspaceRoot: string, oldPath: string, newPath: string): Promise<void> {
    const safeOld = this.resolveSafePath(workspaceRoot, oldPath);
    const safeNew = this.resolveSafePath(workspaceRoot, newPath);
    await fs.mkdir(path.dirname(safeNew), { recursive: true });
    await fs.rename(safeOld, safeNew);
  }

  public async deleteNode(workspaceRoot: string, relativePath: string): Promise<void> {
    const safePath = this.resolveSafePath(workspaceRoot, relativePath);
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.unlink(safePath);
    }
  }

  /**
   * Initializes a clean, empty workspace directory for the user playground.
   */
  public async initStarterWorkspace(workspaceRoot: string, language: string, template = 'starter'): Promise<void> {
    await fs.mkdir(workspaceRoot, { recursive: true });
  }

  /**
   * Starts a Chokidar filesystem watcher for the workspace.
   */
  public watchWorkspace(workspaceId: string, workspaceRoot: string): void {
    if (this.watchers.has(workspaceId)) {
      return;
    }

    const watcher = chokidar.watch(workspaceRoot, {
      ignored: [/(^|[\/\\])\../, /node_modules/],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50,
      },
    });

    const notify = (type: any, absPath: string) => {
      const relPath = path.relative(workspaceRoot, absPath).replace(/\\/g, '/');
      const event: FileSystemChangeEvent = {
        workspaceId,
        type,
        path: relPath,
        timestamp: Date.now(),
      };
      for (const listener of this.onFileChangeListeners) {
        listener(event);
      }
    };

    watcher
      .on('add', (p) => notify('add', p))
      .on('change', (p) => notify('change', p))
      .on('unlink', (p) => notify('unlink', p))
      .on('addDir', (p) => notify('addDir', p))
      .on('unlinkDir', (p) => notify('unlinkDir', p));

    this.watchers.set(workspaceId, watcher);
  }

  public unwatchWorkspace(workspaceId: string): void {
    const watcher = this.watchers.get(workspaceId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(workspaceId);
    }
  }
}
