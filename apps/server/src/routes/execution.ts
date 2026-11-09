import { FastifyInstance } from 'fastify';
import { WorkspaceManager } from '../modules/workspace/WorkspaceManager.js';
import { ExecutionEngine } from '../modules/execution/ExecutionEngine.js';
import { db } from '../db/client.js';

export async function registerExecutionRoutes(
  app: FastifyInstance,
  workspaceManager: WorkspaceManager,
  executionEngine: ExecutionEngine
) {
  // Run code synchronously or return initial stream response
  app.post<{ Params: { id: string }; Body: { filePath: string; code?: string } }>(
    '/api/workspaces/:id/execute',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }

      const { filePath } = req.body;
      if (!filePath) {
        return reply.status(400).send({ success: false, error: 'filePath is required' });
      }

      if (!ws.containerId && workspaceManager.isDockerReady()) {
        ws.containerId = await workspaceManager.ensureContainer(ws);
      }

      const result = await executionEngine.execute(
        ws.id,
        ws.path,
        filePath,
        ws.containerId
      );

      return reply.send({ success: true, data: result });
    }
  );

  // Stop active execution
  app.post<{ Params: { id: string }; Body: { executionId: string } }>(
    '/api/workspaces/:id/execute/stop',
    async (req, reply) => {
      const { executionId } = req.body;
      if (executionId) {
        executionEngine.stopExecution(executionId);
      }
      return reply.send({ success: true, message: 'Execution stopped' });
    }
  );

  // Get execution history
  app.get<{ Params: { id: string } }>('/api/workspaces/:id/executions', async (req, reply) => {
    const list = await db.getExecutions(req.params.id);
    return reply.send({ success: true, data: list });
  });

  // Docker status check
  app.get('/api/system/status', async (req, reply) => {
    const isDocker = await executionEngine.checkDocker();
    return reply.send({
      success: true,
      data: {
        dockerAvailable: isDocker,
        platform: process.platform,
        nodeVersion: process.version,
      },
    });
  });
}
