export type WorkspaceLanguage = 'javascript' | 'typescript' | 'python' | 'html';
export type WorkspaceStatus = 'stopped' | 'running' | 'building' | 'error';

export interface Workspace {
  id: string;
  name: string;
  language: WorkspaceLanguage;
  status: WorkspaceStatus;
  containerId?: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
  template?: string;
}

export interface CreateWorkspaceDto {
  name: string;
  language: WorkspaceLanguage;
  template?: 'starter' | 'algorithms' | 'express' | 'empty';
}

export interface WorkspaceStats {
  cpuUsage?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  activeProcesses?: number;
}
