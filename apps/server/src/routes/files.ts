import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { WorkspaceManager } from '../modules/workspace/WorkspaceManager.js';
import { FilesystemService } from '../modules/filesystem/FilesystemService.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

export async function registerFileRoutes(
  app: FastifyInstance,
  workspaceManager: WorkspaceManager,
  fsService: FilesystemService
) {
  // Helper to serve preview files with correct MIME types and no-cache
  const servePreviewFile = async (
    workspaceId: string,
    subPath: string | undefined,
    reply: any
  ) => {
    const ws = await workspaceManager.getWorkspace(workspaceId);
    if (!ws) {
      return reply.status(404).type('text/html').send('<h1>404: Workspace Not Found</h1>');
    }

    let relPath = subPath || 'index.html';
    if (!relPath || relPath === '/') relPath = 'index.html';

    try {
      const safePath = fsService.resolveSafePath(ws.path, relPath);
      let stats = await fs.stat(safePath);
      let targetPath = safePath;
      if (stats.isDirectory()) {
        targetPath = path.join(safePath, 'index.html');
        stats = await fs.stat(targetPath);
      }

      const ext = path.extname(targetPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBuffer = await fs.readFile(targetPath);

      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Access-Control-Allow-Origin', '*');
      return reply.type(contentType).send(fileBuffer);
    } catch {
      return reply.status(404).type('text/html').send(
        `<!DOCTYPE html>
<html>
<head><title>File Not Found</title><style>body { font-family: system-ui, sans-serif; background: #0b0f17; color: #e2e8f0; display: grid; place-items: center; height: 100vh; margin: 0; }</style></head>
<body>
  <div style="text-align: center; max-width: 480px; padding: 24px;">
    <h2 style="color: #38bdf8;">File Not Found</h2>
    <p style="color: #94a3b8;">Could not locate <code>${relPath}</code> in workspace.</p>
    <p style="font-size: 13px; color: #64748b;">Ensure <code>${relPath}</code> exists in the root of your workspace.</p>
  </div>
</body>
</html>`
      );
    }
  };

  // Preview endpoints for live web application rendering
  app.get<{ Params: { id: string } }>('/api/workspaces/:id/preview', async (req, reply) => {
    return servePreviewFile(req.params.id, 'index.html', reply);
  });

  app.get<{ Params: { id: string; '*': string } }>('/api/workspaces/:id/preview/*', async (req, reply) => {
    return servePreviewFile(req.params.id, req.params['*'], reply);
  });
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
