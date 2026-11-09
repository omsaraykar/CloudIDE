import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { WorkspaceManager } from '../modules/workspace/WorkspaceManager.js';
import { FilesystemService } from '../modules/filesystem/FilesystemService.js';

export async function registerFileRoutes(
  app: FastifyInstance,
  workspaceManager: WorkspaceManager,
  fsService: FilesystemService
) {
  // Get file tree
  app.get<{ Params: { id: string } }>('/api/workspaces/:id/files/tree', async (req, reply) => {
    const ws = await workspaceManager.getWorkspace(req.params.id);
    if (!ws) {
      return reply.status(404).send({ success: false, error: 'Workspace not found' });
    }
    const tree = await fsService.getTree(ws.path);
    return reply.send({ success: true, data: tree });
  });

  // Read file content
  app.get<{ Params: { id: string }; Querystring: { path: string } }>(
    '/api/workspaces/:id/files/content',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }
      const filePath = req.query.path;
      if (!filePath) {
        return reply.status(400).send({ success: false, error: 'Path query param required' });
      }
      try {
        const content = await fsService.readFile(ws.path, filePath);
        return reply.send({ success: true, data: { path: filePath, content } });
      } catch (err) {
        return reply.status(404).send({ success: false, error: (err as Error).message });
      }
    }
  );

  // Write/Save file content (debounced autosave)
  app.post<{ Params: { id: string }; Body: { path: string; content: string } }>(
    '/api/workspaces/:id/files/content',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }
      const { path: filePath, content } = req.body;
      if (!filePath) {
        return reply.status(400).send({ success: false, error: 'Path is required' });
      }
      try {
        await fsService.writeFile(ws.path, filePath, content ?? '');
        return reply.send({ success: true, message: 'File saved successfully' });
      } catch (err) {
        return reply.status(500).send({ success: false, error: (err as Error).message });
      }
    }
  );

  // Create file or directory
  app.post<{ Params: { id: string }; Body: { path: string; type: 'file' | 'directory'; content?: string } }>(
    '/api/workspaces/:id/files',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }
      const { path: filePath, type, content } = req.body;
      if (!filePath || !type) {
        return reply.status(400).send({ success: false, error: 'Path and type are required' });
      }
      try {
        await fsService.createNode(ws.path, filePath, type, content);
        return reply.status(201).send({ success: true, message: `${type} created successfully` });
      } catch (err) {
        return reply.status(500).send({ success: false, error: (err as Error).message });
      }
    }
  );

  // Rename file or directory
  app.put<{ Params: { id: string }; Body: { oldPath: string; newPath: string } }>(
    '/api/workspaces/:id/files/rename',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) {
        return reply.status(400).send({ success: false, error: 'oldPath and newPath are required' });
      }
      try {
        await fsService.renameNode(ws.path, oldPath, newPath);
        return reply.send({ success: true, message: 'Node renamed successfully' });
      } catch (err) {
        return reply.status(500).send({ success: false, error: (err as Error).message });
      }
    }
  );

  // Delete file or directory
  app.delete<{ Params: { id: string }; Querystring: { path: string } }>(
    '/api/workspaces/:id/files',
    async (req, reply) => {
      const ws = await workspaceManager.getWorkspace(req.params.id);
      if (!ws) {
        return reply.status(404).send({ success: false, error: 'Workspace not found' });
      }
      const filePath = req.query.path;
      if (!filePath) {
        return reply.status(400).send({ success: false, error: 'Path query param required' });
      }
      try {
        await fsService.deleteNode(ws.path, filePath);
        return reply.send({ success: true, message: 'Deleted successfully' });
      } catch (err) {
        return reply.status(500).send({ success: false, error: (err as Error).message });
      }
    }
  );
}
