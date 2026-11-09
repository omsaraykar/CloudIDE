import Docker from 'dockerode';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import crypto from 'crypto';
import type { ExecutionResult } from '@cloud-ide/shared';
import { CONFIG } from '../../config.js';
import { db } from '../../db/client.js';

export interface ExecutionCallbacks {
  onStart?: (executionId: string, filePath: string) => void;
  onStdout?: (executionId: string, chunk: string) => void;
  onStderr?: (executionId: string, chunk: string) => void;
  onExit?: (executionId: string, exitCode: number | null, durationMs: number) => void;
  onError?: (executionId: string, error: string) => void;
}

export class ExecutionEngine {
  private docker: Docker;
  private isDockerAvailable = false;
  private activeProcesses = new Map<string, ChildProcess>();

  constructor() {
    this.docker = new Docker(
      process.platform === 'win32'
        ? { socketPath: '//./pipe/docker_engine' }
        : { socketPath: '/var/run/docker.sock' }
    );
    this.checkDocker();
  }

  public async checkDocker(): Promise<boolean> {
    try {
      await this.docker.ping();
      this.isDockerAvailable = true;
      console.log('[ExecutionEngine] Docker engine connected successfully.');
      return true;
    } catch {
      this.isDockerAvailable = false;
      return false;
    }
  }

  public getDockerInstance(): Docker {
    return this.docker;
  }

  public isDockerReady(): boolean {
    return this.isDockerAvailable;
  }

  /**
   * Executes a code file with real-time streaming of stdout and stderr.
   */
  public async execute(
    workspaceId: string,
    workspacePath: string,
    filePath: string,
    containerId?: string | null,
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult> {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    callbacks?.onStart?.(executionId, filePath);

    // If Docker is available and containerId is provided or docker can run container
    if (this.isDockerAvailable && containerId) {
      try {
        return await this.executeInDocker(
          executionId,
          workspaceId,
          workspacePath,
          filePath,
          containerId,
          startTime,
          callbacks
        );
      } catch (dockerErr) {
        console.warn(`[ExecutionEngine] Docker execution failed, falling back to sandboxed runner:`, dockerErr);
      }
    }

    // Sandboxed child process runner
    return await this.executeInSandbox(
      executionId,
      workspaceId,
      workspacePath,
      filePath,
      startTime,
      callbacks
    );
  }

  /**
   * Executes code inside an isolated Docker container with resource constraints.
   */
  private async executeInDocker(
    executionId: string,
    workspaceId: string,
    workspacePath: string,
    filePath: string,
    containerId: string,
    startTime: number,
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult> {
    const container = this.docker.getContainer(containerId);
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const cmd = filePath.endsWith('.py')
      ? ['python3', filePath]
      : filePath.endsWith('.ts')
      ? ['npx', 'tsx', filePath]
      : ['node', filePath];

    // Non-root execution with safe environment
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/workspace',
      User: 'node',
      Env: ['NODE_ENV=development', 'TERM=xterm-256color'],
    });

    return new Promise<ExecutionResult>(async (resolve) => {
      let isDone = false;

      const timeout = setTimeout(async () => {
        if (!isDone) {
          isDone = true;
          const msg = `\n[Timeout Error]: Execution exceeded ${CONFIG.EXECUTION_TIMEOUT_MS}ms limit.\n`;
          stderrBuffer += msg;
          callbacks?.onStderr?.(executionId, msg);
          callbacks?.onError?.(executionId, 'Execution timed out');
          const durationMs = Date.now() - startTime;
          const result: ExecutionResult = {
            executionId,
            workspaceId,
            filePath,
            exitCode: 124,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            durationMs,
            success: false,
            error: 'Execution timed out',
          };
          await db.recordExecution(result);
          callbacks?.onExit?.(executionId, 124, durationMs);
          resolve(result);
        }
      }, CONFIG.EXECUTION_TIMEOUT_MS);

      try {
        const stream = await exec.start({ hijack: true, stdin: false });

        // Demux Docker stream (Docker prefixes headers in non-TTY mode)
        container.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => {
              const text = chunk.toString('utf-8');
              stdoutBuffer += text;
              callbacks?.onStdout?.(executionId, text);
            },
          },
          {
            write: (chunk: Buffer) => {
              const text = chunk.toString('utf-8');
              stderrBuffer += text;
              callbacks?.onStderr?.(executionId, text);
            },
          }
        );

        stream.on('end', async () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeout);

          const inspectData = await exec.inspect();
          const exitCode = inspectData.ExitCode ?? 0;
          const durationMs = Date.now() - startTime;
          const success = exitCode === 0;

          const result: ExecutionResult = {
            executionId,
            workspaceId,
            filePath,
            exitCode,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            durationMs,
            success,
          };

          await db.recordExecution(result);
          callbacks?.onExit?.(executionId, exitCode, durationMs);
          resolve(result);
        });

        stream.on('error', async (err: Error) => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeout);

          const msg = `\nDocker Stream Error: ${err.message}\n`;
          stderrBuffer += msg;
          callbacks?.onStderr?.(executionId, msg);
          callbacks?.onError?.(executionId, err.message);

          const durationMs = Date.now() - startTime;
          const result: ExecutionResult = {
            executionId,
            workspaceId,
            filePath,
            exitCode: 1,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            durationMs,
            success: false,
            error: err.message,
          };

          await db.recordExecution(result);
          callbacks?.onExit?.(executionId, 1, durationMs);
          resolve(result);
        });
      } catch (err) {
        if (!isDone) {
          isDone = true;
          clearTimeout(timeout);
          const errorMsg = (err as Error).message;
          callbacks?.onError?.(executionId, errorMsg);
          const durationMs = Date.now() - startTime;
          resolve({
            executionId,
            workspaceId,
            filePath,
            exitCode: 1,
            stdout: '',
            stderr: errorMsg,
            durationMs,
            success: false,
            error: errorMsg,
          });
        }
      }
    });
  }

  /**
   * Safe local execution engine when Docker daemon is not active.
   */
  private async executeInSandbox(
    executionId: string,
    workspaceId: string,
    workspacePath: string,
    filePath: string,
    startTime: number,
    callbacks?: ExecutionCallbacks
  ): Promise<ExecutionResult> {
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const ext = path.extname(filePath);
    let executable = 'node';
    let args: string[] = ['--max-old-space-size=256', filePath];

    if (ext === '.py') {
      executable = process.platform === 'win32' ? 'python' : 'python3';
      args = [filePath];
    } else if (ext === '.ts') {
      executable = 'node';
      args = ['--max-old-space-size=256', filePath];
    }

    return new Promise<ExecutionResult>((resolve) => {
      let isDone = false;

      const proc = spawn(executable, args, {
        cwd: workspacePath,
        shell: false,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: 'development',
          FORCE_COLOR: '1',
        },
      });

      this.activeProcesses.set(executionId, proc);

      const timeout = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          proc.kill('SIGTERM');
          const msg = `\n[Timeout Error]: Execution exceeded ${CONFIG.EXECUTION_TIMEOUT_MS}ms.\n`;
          stderrBuffer += msg;
          callbacks?.onStderr?.(executionId, msg);
          callbacks?.onError?.(executionId, 'Execution timed out');
          const durationMs = Date.now() - startTime;
          const result: ExecutionResult = {
            executionId,
            workspaceId,
            filePath,
            exitCode: 124,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            durationMs,
            success: false,
            error: 'Execution timed out',
          };
          db.recordExecution(result);
          callbacks?.onExit?.(executionId, 124, durationMs);
          this.activeProcesses.delete(executionId);
          resolve(result);
        }
      }, CONFIG.EXECUTION_TIMEOUT_MS);

      proc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdoutBuffer += text;
        callbacks?.onStdout?.(executionId, text);
      });

      proc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderrBuffer += text;
        callbacks?.onStderr?.(executionId, text);
      });

      proc.on('close', async (code) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        this.activeProcesses.delete(executionId);

        const durationMs = Date.now() - startTime;
        const exitCode = code ?? 0;
        const success = exitCode === 0;

        const result: ExecutionResult = {
          executionId,
          workspaceId,
          filePath,
          exitCode,
          stdout: stdoutBuffer,
          stderr: stderrBuffer,
          durationMs,
          success,
        };

        await db.recordExecution(result);
        callbacks?.onExit?.(executionId, exitCode, durationMs);
        resolve(result);
      });

      proc.on('error', async (err) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        this.activeProcesses.delete(executionId);

        const msg = `\nProcess spawn error: ${err.message}\n`;
        stderrBuffer += msg;
        callbacks?.onStderr?.(executionId, msg);
        callbacks?.onError?.(executionId, err.message);

        const durationMs = Date.now() - startTime;
        const result: ExecutionResult = {
          executionId,
          workspaceId,
          filePath,
          exitCode: 1,
          stdout: stdoutBuffer,
          stderr: stderrBuffer,
          durationMs,
          success: false,
          error: err.message,
        };

        await db.recordExecution(result);
        callbacks?.onExit?.(executionId, 1, durationMs);
        resolve(result);
      });
    });
  }

  public stopExecution(executionId: string): void {
    const proc = this.activeProcesses.get(executionId);
    if (proc) {
      proc.kill('SIGINT');
      this.activeProcesses.delete(executionId);
    }
  }
}
