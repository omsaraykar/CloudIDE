export interface TerminalSessionInfo {
  sessionId: string;
  workspaceId: string;
  createdAt: number;
}

export interface TerminalInitOptions {
  workspaceId: string;
  cols: number;
  rows: number;
}

export interface TerminalInputData {
  sessionId: string;
  data: string;
}

export interface TerminalResizeData {
  sessionId: string;
  cols: number;
  rows: number;
}
