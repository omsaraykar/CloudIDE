import type {
  Workspace,
  CreateWorkspaceDto,
  FileNode,
  ExecutionResult,
} from '@cloud-ide/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = {
  // Playground Enter (Single Dedicated Container per User)
  async enterPlayground(username: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/api/playground/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to enter playground');
    return json.data;
  },

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch(`${API_BASE}/api/workspaces`);
    const json = await res.json();
    return json.data || [];
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/api/workspaces/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch workspace');
    return json.data;
  },

  async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create workspace');
    return json.data;
  },

  async deleteWorkspace(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/workspaces/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete workspace');
  },

  // Files
  async getFileTree(workspaceId: string): Promise<FileNode[]> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files/tree`);
    const json = await res.json();
    return json.data || [];
  },

  async getFileContent(workspaceId: string, path: string): Promise<string> {
    const res = await fetch(
      `${API_BASE}/api/workspaces/${workspaceId}/files/content?path=${encodeURIComponent(path)}`
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to read file');
    return json.data.content;
  },

  async saveFileContent(workspaceId: string, path: string, content: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save file');
  },

  async createFile(
    workspaceId: string,
    path: string,
    type: 'file' | 'directory',
    content?: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, type, content }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create node');
  },

  async renameFile(workspaceId: string, oldPath: string, newPath: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to rename node');
  },

  async deleteFile(workspaceId: string, path: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`,
      { method: 'DELETE' }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete node');
  },

  // Execution
  async executeFile(workspaceId: string, filePath: string): Promise<ExecutionResult> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Execution failed');
    return json.data;
  },

  async stopExecution(workspaceId: string, executionId: string): Promise<void> {
    await fetch(`${API_BASE}/api/workspaces/${workspaceId}/execute/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ executionId }),
    });
  },

  async getExecutions(workspaceId: string): Promise<ExecutionResult[]> {
    const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/executions`);
    const json = await res.json();
    return json.data || [];
  },

  async getSystemStatus(): Promise<{ dockerAvailable: boolean; platform: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/system/status`);
      const json = await res.json();
      return json.data;
    } catch {
      return { dockerAvailable: false, platform: 'unknown' };
    }
  },
};
