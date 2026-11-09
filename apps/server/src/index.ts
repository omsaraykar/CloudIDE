import Fastify from 'fastify';
import cors from '@fastify/cors';
import { CONFIG } from './config.js';
import { db } from './db/client.js';
import { FilesystemService } from './modules/filesystem/FilesystemService.js';
import { ExecutionEngine } from './modules/execution/ExecutionEngine.js';
import { WorkspaceManager } from './modules/workspace/WorkspaceManager.js';
import { TerminalService } from './modules/terminal/TerminalService.js';
import { WebSocketGateway } from './modules/websocket/WebSocketGateway.js';
import { registerWorkspaceRoutes } from './routes/workspaces.js';
import { registerFileRoutes } from './routes/files.js';
import { registerExecutionRoutes } from './routes/execution.js';

async function bootstrap() {
  const app = Fastify({
    logger: true,
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Initialize DB
  await db.init();

  // Instantiate Core Services
  const fsService = new FilesystemService();
  const executionEngine = new ExecutionEngine();
  const workspaceManager = new WorkspaceManager(fsService, executionEngine);
  const terminalService = new TerminalService(executionEngine);

  // Health check route
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register REST routes
  await registerWorkspaceRoutes(app, workspaceManager);
  await registerFileRoutes(app, workspaceManager, fsService);
  await registerExecutionRoutes(app, workspaceManager, executionEngine);

  // Initialize Socket.IO Gateway using Fastify's raw HTTP server
  const wsGateway = new WebSocketGateway(
    app.server,
    workspaceManager,
    executionEngine,
    fsService,
    terminalService
  );

  // Start HTTP & WebSocket Server
  try {
    await app.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`\n=================================================`);
    console.log(`🚀 CloudIDE Fastify Server running at http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`🔌 Socket.IO Gateway active at ws://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`📦 Docker Engine Status: ${executionEngine.isDockerReady() ? 'Connected' : 'Local Sandbox Mode'}`);
    console.log(`=================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap().catch(console.error);
