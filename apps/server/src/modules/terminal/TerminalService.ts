import { spawn, ChildProcess } from 'child_process';
import Docker from 'dockerode';
import crypto from 'crypto';
import type { Workspace } from '@cloud-ide/shared';
import { ExecutionEngine } from '../execution/ExecutionEngine.js';

interface TerminalSession {
  sessionId: string;
  workspaceId: string;
  process?: ChildProcess;
  stream?: NodeJS.ReadWriteStream;
  type: 'docker' | 'process';
  createdAt: number;
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();
  private docker: Docker;

  constructor(private executionEngine: ExecutionEngine) {
    this.docker = this.executionEngine.getDockerInstance();
  }

  public getSessions(): Map<string, TerminalSession> {
    return this.sessions;
  }

  public async createSession(
    workspace: Workspace,
    cols = 80,
    rows = 24,
    onData: (sessionId: string, data: string) => void,
    onExit: (sessionId: string, code: number) => void
  ): Promise<string> {
    const sessionId = crypto.randomUUID();

    // 1. Try Docker container shell
    if (workspace.containerId && this.executionEngine.isDockerReady()) {
      try {
        const container = this.docker.getContainer(workspace.containerId);
        const exec = await container.exec({
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          Cmd: ['/bin/bash'],
          Env: [
            'TERM=xterm-256color',
            'COLORTERM=truecolor',
            'PS1=\\[\\033[1;36m\\]cloudide\\[\\033[0m\\]:\\[\\033[1;32m\\]\\w\\[\\033[0m\\]# ',
          ],
        });

        const stream = await exec.start({
          hijack: true,
          stdin: true,
          Tty: true,
        });

        stream.on('data', (chunk: Buffer) => {
          onData(sessionId, chunk.toString('utf-8'));
        });

        stream.on('end', () => {
          this.sessions.delete(sessionId);
          onExit(sessionId, 0);
        });

        this.sessions.set(sessionId, {
          sessionId,
          workspaceId: workspace.id,
          stream,
          type: 'docker',
          createdAt: Date.now(),
        });

        // Send welcoming banner
        onData(
          sessionId,
          `\x1b[1;36m🚀 CloudIDE Container Terminal [${workspace.name}]\x1b[0m\r\n\x1b[90mLinux bash shell active with full root access (apk, npm, pip, git ready).\x1b[0m\r\n`
        );
        return sessionId;
      } catch (err) {
        console.warn(`[TerminalService] Docker TTY attach failed, falling back to local shell:`, err);
      }
    }

    // 2. Local interactive shell fallback
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'powershell.exe' : (process.env.SHELL || 'bash');
    const wsName = workspace.name || 'workspace';

    const customPromptCmd = [
      `Write-Host "CloudIDE Interactive Terminal [${wsName}]" -ForegroundColor Cyan;`,
      `Write-Host "Environment: Node.js $(node -v) | Ready" -ForegroundColor DarkGray;`,
      'function prompt {',
      '  $loc = Split-Path -Leaf (Get-Location);',
      '  "$([char]27)[1;36mcloudide$([char]27)[0m:$([char]27)[1;32m$loc$([char]27)[0m$ "',
      '}'
    ].join(' ');

    const shellArgs = isWin
      ? ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', customPromptCmd]
      : ['--norc', '--noprofile'];

    const proc = spawn(shell, shellArgs, {
      cwd: workspace.path,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    proc.stdout?.on('data', (chunk: Buffer) => {
      onData(sessionId, chunk.toString());
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      onData(sessionId, chunk.toString());
    });

    proc.on('close', (code) => {
      this.sessions.delete(sessionId);
      onExit(sessionId, code ?? 0);
    });

    proc.on('error', (err) => {
      onData(sessionId, `\r\n\x1b[31mTerminal error: ${err.message}\x1b[0m\r\n`);
      this.sessions.delete(sessionId);
      onExit(sessionId, 1);
    });

    this.sessions.set(sessionId, {
      sessionId,
      workspaceId: workspace.id,
      process: proc,
      type: 'process',
      createdAt: Date.now(),
    });

    return sessionId;
  }

  public write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.type === 'docker' && session.stream) {
      session.stream.write(data);
    } else if (session.type === 'process' && session.process?.stdin) {
      session.process.stdin.write(data);
    }
  }

  public resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    // For pty or docker resize if supported
  }

  public closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.type === 'docker' && session.stream) {
      session.stream.end();
    } else if (session.type === 'process' && session.process) {
      session.process.kill();
    }
    this.sessions.delete(sessionId);
  }

  public closeAllForWorkspace(workspaceId: string): void {
    for (const [id, session] of this.sessions.entries()) {
      if (session.workspaceId === workspaceId) {
        this.closeSession(id);
      }
    }
  }
}
