import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  FileSystemChangeEvent,
} from '@cloud-ide/shared';
import { WorkspaceManager } from '../workspace/WorkspaceManager.js';
import { ExecutionEngine } from '../execution/ExecutionEngine.js';
import { FilesystemService } from '../filesystem/FilesystemService.js';
import { TerminalService } from '../terminal/TerminalService.js';

export class WebSocketGateway {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    httpServer: HttpServer,
    private workspaceManager: WorkspaceManager,
    private executionEngine: ExecutionEngine,
    private fsService: FilesystemService,
    private terminalService: TerminalService
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
    this.setupFsSync();
  }

  private setupFsSync(): void {
    this.fsService.onFileChange((event: FileSystemChangeEvent) => {
      // Broadcast file change to clients in the workspace room
      this.io.to(`workspace:${event.workspaceId}`).emit('fs:change', event);
    });
  }

  private setupListeners(): void {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log(`[WS] Client connected: ${socket.id}`);

      // Room management
      socket.on('workspace:join', (workspaceId: string) => {
        socket.join(`workspace:${workspaceId}`);
        console.log(`[WS] Socket ${socket.id} joined workspace:${workspaceId}`);
      });

      socket.on('workspace:leave', (workspaceId: string) => {
        socket.leave(`workspace:${workspaceId}`);
        console.log(`[WS] Socket ${socket.id} left workspace:${workspaceId}`);
      });

      // Terminal creation
      socket.on('terminal:create', async ({ workspaceId, cols, rows }) => {
        const workspace = await this.workspaceManager.getWorkspace(workspaceId);
        if (!workspace) {
          socket.emit('terminal:error', { sessionId: '', error: 'Workspace not found' });
          return;
        }

        try {
          const sessionId = await this.terminalService.createSession(
            workspace,
            cols,
            rows,
            (data: string) => {
              socket.emit('terminal:data', { sessionId, data });
            },
            (exitCode: number) => {
              socket.emit('terminal:exit', { sessionId, exitCode });
            }
          );

          socket.emit('terminal:created', { sessionId });
        } catch (err) {
          socket.emit('terminal:error', { sessionId: '', error: (err as Error).message });
        }
      });

      socket.on('terminal:input', ({ sessionId, data }) => {
        this.terminalService.write(sessionId, data);
      });

      socket.on('terminal:resize', ({ sessionId, cols, rows }) => {
        this.terminalService.resize(sessionId, cols, rows);
      });

      socket.on('terminal:close', (sessionId) => {
        this.terminalService.closeSession(sessionId);
      });

      // Execution trigger via WebSocket
      socket.on('exec:run', async ({ workspaceId, filePath, code }) => {
        const workspace = await this.workspaceManager.getWorkspace(workspaceId);
        if (!workspace) {
          socket.emit('exec:error', { executionId: '', error: 'Workspace not found' });
          return;
        }

        // If code provided directly, save before running
        if (code !== undefined) {
          await this.fsService.writeFile(workspace.path, filePath, code);
        }

        const room = `workspace:${workspaceId}`;

        await this.executionEngine.execute(
          workspaceId,
          workspace.path,
          filePath,
          workspace.containerId,
          {
            onStart: (executionId, targetFile) => {
              this.io.to(room).emit('exec:start', { executionId, filePath: targetFile });
            },
            onStdout: (executionId, text) => {
              this.io.to(room).emit('exec:stdout', { executionId, text });
            },
            onStderr: (executionId, text) => {
              this.io.to(room).emit('exec:stderr', { executionId, text });
            },
            onExit: (executionId, exitCode, durationMs) => {
              this.io.to(room).emit('exec:exit', { executionId, exitCode, durationMs });
            },
            onError: (executionId, error) => {
              this.io.to(room).emit('exec:error', { executionId, error });
            },
          }
        );
      });

      socket.on('exec:stop', ({ executionId }) => {
        if (executionId) {
          this.executionEngine.stopExecution(executionId);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
