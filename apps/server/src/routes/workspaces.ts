import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { WorkspaceManager } from '../modules/workspace/WorkspaceManager.js';

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
  language: z.enum(['javascript', 'typescript', 'python', 'html']),
  template: z.enum(['starter', 'algorithms', 'express', 'empty']).optional(),
});

export async function registerWorkspaceRoutes(
  app: FastifyInstance,
  workspaceManager: WorkspaceManager
) {
  // List workspaces
  app.get('/api/workspaces', async (req, reply) => {
    const list = await workspaceManager.listWorkspaces();
    return reply.send({ success: true, data: list });
  });

  // Get workspace
  app.get<{ Params: { id: string } }>('/api/workspaces/:id', async (req, reply) => {
    const ws = await workspaceManager.getWorkspace(req.params.id);
    if (!ws) {
      return reply.status(404).send({ success: false, error: 'Workspace not found' });
    }
    return reply.send({ success: true, data: ws });
  });

  // Create workspace
  app.post('/api/workspaces', async (req, reply) => {
    const parse = CreateWorkspaceSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.issues[0].message });
    }
    const ws = await workspaceManager.createWorkspace(parse.data);
    return reply.status(201).send({ success: true, data: ws });
  });

  // Start workspace
  app.post<{ Params: { id: string } }>('/api/workspaces/:id/start', async (req, reply) => {
    const ws = await workspaceManager.startWorkspace(req.params.id);
    if (!ws) {
      return reply.status(404).send({ success: false, error: 'Workspace not found' });
    }
    return reply.send({ success: true, data: ws });
  });

  // Stop workspace
  app.post<{ Params: { id: string } }>('/api/workspaces/:id/stop', async (req, reply) => {
    const ws = await workspaceManager.stopWorkspace(req.params.id);
    if (!ws) {
      return reply.status(404).send({ success: false, error: 'Workspace not found' });
    }
    return reply.send({ success: true, data: ws });
  });

  // Delete workspace
  app.delete<{ Params: { id: string } }>('/api/workspaces/:id', async (req, reply) => {
    const success = await workspaceManager.deleteWorkspace(req.params.id);
    if (!success) {
      return reply.status(404).send({ success: false, error: 'Workspace not found' });
    }
    return reply.send({ success: true, message: 'Workspace deleted' });
  });
}
