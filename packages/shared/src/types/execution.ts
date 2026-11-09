export interface RunCodeRequest {
  workspaceId: string;
  filePath: string;
  code?: string;
  args?: string[];
  timeoutMs?: number;
}

export interface ExecutionResult {
  executionId: string;
  workspaceId: string;
  filePath: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export type ExecutionStreamType = 'stdout' | 'stderr' | 'exit' | 'start' | 'error';

export interface ExecutionStreamEvent {
  executionId: string;
  workspaceId: string;
  type: ExecutionStreamType;
  data: string;
  timestamp: number;
}
