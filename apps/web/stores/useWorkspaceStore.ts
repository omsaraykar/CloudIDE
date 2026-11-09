import { create } from 'zustand';
import type { Workspace, FileNode, FileSystemChangeEvent } from '@cloud-ide/shared';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language?: string;
}

export interface OutputLog {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'success';
  text: string;
  time: string;
}

interface WorkspaceState {
  // Current workspace
  workspace: Workspace | null;
  isLoadingWorkspace: boolean;
  
  // Files
  fileTree: FileNode[];
  isLoadingTree: boolean;
  openFiles: OpenFile[];
  activeFilePath: string | null;
  
  // Save status
  saveStatus: 'saved' | 'saving' | 'unsaved';
  debounceTimer: NodeJS.Timeout | null;

  // Execution
  isRunning: boolean;
  activeExecutionId: string | null;
  outputLogs: OutputLog[];

  // Layout & UI
  isSidebarOpen: boolean;
  isBottomPanelOpen: boolean;
  activeBottomTab: 'terminal' | 'output' | 'problems';

  // Live Browser Preview
  isPreviewOpen: boolean;
  previewPath: string;
  previewRefreshKey: number;

  // Actions
  initWorkspace: (workspaceId: string) => Promise<void>;
  leaveWorkspace: () => void;
  loadFileTree: () => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  closeFile: (filePath: string) => void;
  setActiveFile: (filePath: string) => void;
  updateFileContent: (filePath: string, content: string) => void;
  saveCurrentFile: () => Promise<void>;
  createNode: (path: string, type: 'file' | 'directory', content?: string) => Promise<void>;
  renameNode: (oldPath: string, newPath: string) => Promise<void>;
  deleteNode: (path: string) => Promise<void>;
  runCode: (targetFilePath?: string) => Promise<void>;
  stopCode: () => void;
  clearOutput: () => void;
  setBottomTab: (tab: 'terminal' | 'output' | 'problems') => void;
  toggleBottomPanel: () => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  setPreviewOpen: (open: boolean) => void;
  setPreviewPath: (path: string) => void;
  refreshPreview: () => void;
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'sh':
      return 'shell';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  isLoadingWorkspace: true,
  fileTree: [],
  isLoadingTree: false,
  openFiles: [],
  activeFilePath: null,
  saveStatus: 'saved',
  debounceTimer: null,
  isRunning: false,
  activeExecutionId: null,
  outputLogs: [],
  isSidebarOpen: true,
  isBottomPanelOpen: true,
  activeBottomTab: 'output',
  isPreviewOpen: false,
  previewPath: 'index.html',
  previewRefreshKey: 0,

  initWorkspace: async (workspaceId: string) => {
    set({ isLoadingWorkspace: true });
    try {
      const workspace = await api.getWorkspace(workspaceId);
      set({ workspace, isLoadingWorkspace: false });

      // Join socket room
      const socket = getSocket();
      socket.emit('workspace:join', workspaceId);

      // Listen for real-time filesystem updates
      socket.off('fs:change');
      socket.on('fs:change', (event: FileSystemChangeEvent) => {
        console.log('[FS:Change Event]', event);
        get().loadFileTree();
      });

      // Listen for execution streaming
      socket.off('exec:start');
      socket.on('exec:start', ({ executionId, filePath }) => {
        set((state) => ({
          isRunning: true,
          activeExecutionId: executionId,
          activeBottomTab: 'output',
          isBottomPanelOpen: true,
          outputLogs: [
            ...state.outputLogs,
            {
              id: `${Date.now()}-start`,
              type: 'info',
              text: `[CloudIDE] Executing "${filePath}"...\n`,
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      });

      socket.off('exec:stdout');
      socket.on('exec:stdout', ({ text }) => {
        set((state) => ({
          outputLogs: [
            ...state.outputLogs,
            {
              id: `${Date.now()}-out`,
              type: 'stdout',
              text,
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      });

      socket.off('exec:stderr');
      socket.on('exec:stderr', ({ text }) => {
        set((state) => ({
          outputLogs: [
            ...state.outputLogs,
            {
              id: `${Date.now()}-err`,
              type: 'stderr',
              text,
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      });

      socket.off('exec:exit');
      socket.on('exec:exit', ({ exitCode, durationMs }) => {
        set((state) => ({
          isRunning: false,
          activeExecutionId: null,
          outputLogs: [
            ...state.outputLogs,
            {
              id: `${Date.now()}-exit`,
              type: exitCode === 0 ? 'success' : 'error',
              text: `\n[Process exited with code ${exitCode} in ${durationMs}ms]\n`,
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      });

      socket.off('exec:error');
      socket.on('exec:error', ({ error }) => {
        set((state) => ({
          isRunning: false,
          activeExecutionId: null,
          outputLogs: [
            ...state.outputLogs,
            {
              id: `${Date.now()}-error`,
              type: 'error',
              text: `\n[Execution Error]: ${error}\n`,
              time: new Date().toLocaleTimeString(),
            },
          ],
        }));
      });

      // Load file tree
      await get().loadFileTree();

      // Open primary file if exists (e.g. index.js, index.ts, main.py)
      const tree = get().fileTree;
      const primaryFile =
        tree.find((f) => f.type === 'file' && ['index.js', 'index.ts', 'main.py', 'index.html'].includes(f.name)) ||
        tree.find((f) => f.type === 'file');

      if (primaryFile) {
        await get().openFile(primaryFile.path);
      }
    } catch (err) {
      console.error('[Workspace Store] Error loading workspace:', err);
      set({ isLoadingWorkspace: false });
    }
  },

  leaveWorkspace: () => {
    const { workspace } = get();
    if (workspace) {
      const socket = getSocket();
      socket.emit('workspace:leave', workspace.id);
      socket.off('fs:change');
      socket.off('exec:start');
      socket.off('exec:stdout');
      socket.off('exec:stderr');
      socket.off('exec:exit');
      socket.off('exec:error');
    }
    set({
      workspace: null,
      fileTree: [],
      openFiles: [],
      activeFilePath: null,
      outputLogs: [],
    });
  },

  loadFileTree: async () => {
    const { workspace } = get();
    if (!workspace) return;
    try {
      const tree = await api.getFileTree(workspace.id);
      set({ fileTree: tree });
    } catch (err) {
      console.error('[Workspace Store] Error loading file tree:', err);
    }
  },

  openFile: async (filePath: string) => {
    const { workspace, openFiles } = get();
    if (!workspace) return;

    // Check if already open
    const isHtml = filePath.endsWith('.html') || filePath.endsWith('.htm');
    const existing = openFiles.find((f) => f.path === filePath);
    if (existing) {
      set({
        activeFilePath: filePath,
        ...(isHtml ? { previewPath: filePath } : {}),
      });
      return;
    }

    try {
      const content = await api.getFileContent(workspace.id, filePath);
      const name = filePath.split('/').pop() || filePath;
      const lang = detectLanguage(filePath);

      const newFile: OpenFile = {
        path: filePath,
        name,
        content,
        originalContent: content,
        isDirty: false,
        language: lang,
      };

      set({
        openFiles: [...openFiles, newFile],
        activeFilePath: filePath,
        ...(isHtml ? { previewPath: filePath } : {}),
      });
    } catch (err) {
      console.error(`[Workspace Store] Error opening file ${filePath}:`, err);
    }
  },

  closeFile: (filePath: string) => {
    const { openFiles, activeFilePath } = get();
    const updated = openFiles.filter((f) => f.path !== filePath);

    let nextActive = activeFilePath;
    if (activeFilePath === filePath) {
      if (updated.length > 0) {
        const closedIdx = openFiles.findIndex((f) => f.path === filePath);
        const nextIdx = Math.max(0, closedIdx - 1);
        nextActive = updated[nextIdx].path;
      } else {
        nextActive = null;
      }
    }

    set({ openFiles: updated, activeFilePath: nextActive });
  },

  setActiveFile: (filePath: string) => {
    set({ activeFilePath: filePath });
  },

  updateFileContent: (filePath: string, content: string) => {
    const { openFiles, debounceTimer, workspace } = get();
    if (debounceTimer) clearTimeout(debounceTimer);

    const updated = openFiles.map((f) => {
      if (f.path === filePath) {
        return {
          ...f,
          content,
          isDirty: content !== f.originalContent,
        };
      }
      return f;
    });

    set({
      openFiles: updated,
      saveStatus: 'unsaved',
      debounceTimer: setTimeout(async () => {
        if (!workspace) return;
        set({ saveStatus: 'saving' });
        try {
          await api.saveFileContent(workspace.id, filePath, content);
          set((state) => ({
            saveStatus: 'saved',
            openFiles: state.openFiles.map((file) =>
              file.path === filePath
                ? { ...file, originalContent: content, isDirty: false }
                : file
            ),
          }));
        } catch (err) {
          console.error('[Autosave] Failed to autosave:', err);
          set({ saveStatus: 'unsaved' });
        }
      }, 750), // 750ms debounced autosave
    });
  },

  saveCurrentFile: async () => {
    const { workspace, openFiles, activeFilePath, debounceTimer } = get();
    if (!workspace || !activeFilePath) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    const activeFile = openFiles.find((f) => f.path === activeFilePath);
    if (!activeFile) return;

    set({ saveStatus: 'saving' });
    try {
      await api.saveFileContent(workspace.id, activeFilePath, activeFile.content);
      const ext = activeFilePath.split('.').pop()?.toLowerCase() || '';
      const isWebAsset = ['html', 'htm', 'css', 'js'].includes(ext);

      set((state) => ({
        saveStatus: 'saved',
        previewRefreshKey: isWebAsset ? state.previewRefreshKey + 1 : state.previewRefreshKey,
        openFiles: state.openFiles.map((file) =>
          file.path === activeFilePath
            ? { ...file, originalContent: file.content, isDirty: false }
            : file
        ),
      }));
    } catch (err) {
      console.error('[Save] Failed to save file:', err);
      set({ saveStatus: 'unsaved' });
    }
  },

  createNode: async (path: string, type: 'file' | 'directory', content?: string) => {
    const { workspace, loadFileTree, openFile } = get();
    if (!workspace) return;
    await api.createFile(workspace.id, path, type, content);
    await loadFileTree();
    if (type === 'file') {
      await openFile(path);
    }
  },

  renameNode: async (oldPath: string, newPath: string) => {
    const { workspace, loadFileTree, openFiles, activeFilePath } = get();
    if (!workspace) return;
    await api.renameFile(workspace.id, oldPath, newPath);
    await loadFileTree();

    // Update opened file tabs if any match
    const updated = openFiles.map((f) => {
      if (f.path === oldPath) {
        return {
          ...f,
          path: newPath,
          name: newPath.split('/').pop() || newPath,
          language: detectLanguage(newPath),
        };
      }
      return f;
    });

    const nextActive = activeFilePath === oldPath ? newPath : activeFilePath;
    set({ openFiles: updated, activeFilePath: nextActive });
  },

  deleteNode: async (path: string) => {
    const { workspace, loadFileTree, closeFile } = get();
    if (!workspace) return;
    await api.deleteFile(workspace.id, path);
    closeFile(path);
    await loadFileTree();
  },

  runCode: async (targetFilePath?: string) => {
    const { workspace, activeFilePath, saveCurrentFile, isRunning } = get();
    if (!workspace || isRunning) return;

    const fileToRun = targetFilePath || activeFilePath;
    if (!fileToRun) {
      set((state) => ({
        outputLogs: [
          ...state.outputLogs,
          {
            id: `${Date.now()}-warn`,
            type: 'error',
            text: 'No file selected to run. Please open a file first.\n',
            time: new Date().toLocaleTimeString(),
          },
        ],
      }));
      return;
    }

    // Save active file first
    await saveCurrentFile();

    const isHtml = fileToRun.endsWith('.html') || fileToRun.endsWith('.htm');
    if (isHtml) {
      set((state) => ({
        isPreviewOpen: true,
        previewPath: fileToRun,
        previewRefreshKey: state.previewRefreshKey + 1,
      }));
    }

    const socket = getSocket();
    set({
      isRunning: true,
      activeBottomTab: 'output',
      isBottomPanelOpen: true,
    });

    socket.emit('exec:run', {
      workspaceId: workspace.id,
      filePath: fileToRun,
    });
  },

  stopCode: () => {
    const { workspace, activeExecutionId } = get();
    if (!workspace || !activeExecutionId) return;
    const socket = getSocket();
    socket.emit('exec:stop', {
      workspaceId: workspace.id,
      executionId: activeExecutionId,
    });
    set({ isRunning: false, activeExecutionId: null });
  },

  clearOutput: () => {
    set({ outputLogs: [] });
  },

  setBottomTab: (tab) => {
    set({ activeBottomTab: tab, isBottomPanelOpen: true });
  },

  toggleBottomPanel: () => {
    set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen }));
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  togglePreview: () => {
    set((state) => ({ isPreviewOpen: !state.isPreviewOpen }));
  },

  setPreviewOpen: (open) => {
    set({ isPreviewOpen: open });
  },

  setPreviewPath: (path) => {
    set({ previewPath: path });
  },

  refreshPreview: () => {
    set((state) => ({ previewRefreshKey: state.previewRefreshKey + 1 }));
  },
}));
