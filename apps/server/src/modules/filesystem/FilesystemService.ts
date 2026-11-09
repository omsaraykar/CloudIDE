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
   * Initializes starter files based on language and template.
   */
  public async initStarterWorkspace(workspaceRoot: string, language: string, template = 'starter'): Promise<void> {
    await fs.mkdir(workspaceRoot, { recursive: true });

    if (language === 'javascript') {
      await this.writeFile(
        workspaceRoot,
        'index.js',
        `// Welcome to CloudIDE JavaScript Workspace!
// Press "Run" in the top bar to execute this file in an isolated container.

function calculateStats(numbers) {
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { sum, avg, min, max };
}

console.log("⚡ [CloudIDE] Starting Execution...");
console.log("System Node version:", process.version);
console.log("Platform:", process.platform);

const testData = [12, 45, 78, 23, 99, 54, 88];
const stats = calculateStats(testData);

console.log("\\n📊 Performance & Math Analysis:");
console.table(stats);

console.log("\\n🚀 CloudIDE Node.js Container Execution Completed successfully!");
`
      );

      await this.writeFile(
        workspaceRoot,
        'utils.js',
        `// Utility functions module
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`
      );

      await this.writeFile(
        workspaceRoot,
        'package.json',
        JSON.stringify(
          {
            name: 'cloudide-js-workspace',
            version: '1.0.0',
            main: 'index.js',
            type: 'module',
            scripts: {
              start: 'node index.js',
            },
          },
          null,
          2
        )
      );

      await this.writeFile(
        workspaceRoot,
        'README.md',
        `# CloudIDE JavaScript Workspace

Welcome to your cloud-powered developer environment!

## Features
- **Monaco Editor** with TypeScript/JS intellisense and syntax highlighting
- **Docker Container Execution** with stdout/stderr streaming
- **Interactive xterm.js Terminal** connected to workspace container
- **Debounced Autosave** and file sync via Chokidar
`
      );
    } else if (language === 'typescript') {
      await this.writeFile(
        workspaceRoot,
        'index.ts',
        `// Welcome to CloudIDE TypeScript Workspace!
interface User {
  id: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
}

const users: User[] = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'developer' }
];

console.log("TypeScript Workspace Running!");
console.table(users);
`
      );

      await this.writeFile(
        workspaceRoot,
        'tsconfig.json',
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              strict: true,
              esModuleInterop: true,
            },
          },
          null,
          2
        )
      );
    } else if (language === 'python') {
      await this.writeFile(
        workspaceRoot,
        'main.py',
        `# Welcome to CloudIDE Python Workspace!
import sys

def main():
    print(f"Python version: {sys.version}")
    data = [x ** 2 for x in range(1, 11)]
    print(f"Squares 1-10: {data}")
    print("CloudIDE Python Execution finished.")

if __name__ == "__main__":
    main()
`
      );
    } else {
      // HTML/Web
      await this.writeFile(
        workspaceRoot,
        'index.html',
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CloudIDE Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello from CloudIDE!</h1>
  <script src="app.js"></script>
</body>
</html>`
      );
      await this.writeFile(workspaceRoot, 'style.css', 'body { font-family: sans-serif; background: #111; color: #eee; }');
      await this.writeFile(workspaceRoot, 'app.js', 'console.log("CloudIDE Web Preview Ready!");');
    }
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
