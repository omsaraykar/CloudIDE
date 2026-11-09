import type { FileSystemChangeEvent } from './file.js';
import type { ExecutionStreamEvent } from './execution.js';
import type { TerminalResizeData, TerminalInputData } from './terminal.js';

export interface ServerToClientEvents {
  // File events
  'fs:change': (event: FileSystemChangeEvent) => void;
  
  // Execution events
  'exec:start': (data: { executionId: string; filePath: string }) => void;
  'exec:stdout': (data: { executionId: string; text: string }) => void;
  'exec:stderr': (data: { executionId: string; text: string }) => void;
  'exec:exit': (data: { executionId: string; exitCode: number | null; durationMs: number }) => void;
  'exec:error': (data: { executionId: string; error: string }) => void;

  // Terminal events
  'terminal:created': (data: { sessionId: string }) => void;
  'terminal:data': (data: { sessionId: string; data: string }) => void;
  'terminal:exit': (data: { sessionId: string; exitCode: number }) => void;
  'terminal:error': (data: { sessionId: string; error: string }) => void;
}

export interface ClientToServerEvents {
  // Subscriptions
  'workspace:join': (workspaceId: string) => void;
  'workspace:leave': (workspaceId: string) => void;

  // Terminal actions
  'terminal:create': (options: { workspaceId: string; cols: number; rows: number }) => void;
  'terminal:input': (data: TerminalInputData) => void;
  'terminal:resize': (data: TerminalResizeData) => void;
  'terminal:close': (sessionId: string) => void;

  // Execution actions
  'exec:run': (data: { workspaceId: string; filePath: string; code?: string }) => void;
  'exec:stop': (data: { workspaceId: string; executionId?: string }) => void;
}
