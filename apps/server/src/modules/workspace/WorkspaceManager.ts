import Docker from 'dockerode';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import type { Workspace, CreateWorkspaceDto } from '@cloud-ide/shared';
import { CONFIG } from '../../config.js';
import { db } from '../../db/client.js';
import { FilesystemService } from '../filesystem/FilesystemService.js';
import { ExecutionEngine } from '../execution/ExecutionEngine.js';

const DEV_PORT_BINDINGS: Record<string, Array<{ HostPort: string }>> = {
  '5173/tcp': [{ HostPort: '5173' }],
  '4173/tcp': [{ HostPort: '4173' }],
  '3001/tcp': [{ HostPort: '3001' }],
  '8080/tcp': [{ HostPort: '8080' }],
  '8000/tcp': [{ HostPort: '8000' }],
  '5000/tcp': [{ HostPort: '5000' }],
};

const DEV_EXPOSED_PORTS: Record<string, {}> = {
  '5173/tcp': {},
  '4173/tcp': {},
  '3001/tcp': {},
  '8080/tcp': {},
  '8000/tcp': {},
  '5000/tcp': {},
};

export class WorkspaceManager {
  private docker: Docker;

  constructor(
    private fsService: FilesystemService,
    private executionEngine: ExecutionEngine
  ) {
    this.docker = this.executionEngine.getDockerInstance();
  }

  public isDockerReady(): boolean {
    return this.executionEngine.isDockerReady();
  }

  public async ensureContainer(ws: Workspace): Promise<string | null> {
    if (!this.executionEngine.isDockerReady()) return null;

    if (ws.containerId) {
      try {
        const container = this.docker.getContainer(ws.containerId);
        const inspect = await container.inspect();
        if (!inspect.State.Running) {
          await container.start();
        }
        return ws.containerId;
      } catch {
        // Container may have been pruned or deleted, recreate below
      }
    }

    try {
      const container = await this.createContainerSafe({
        Image: CONFIG.DOCKER_DEFAULT_IMAGE,
        name: `cloudide-${ws.id}`,
        Tty: true,
        OpenStdin: true,
        WorkingDir: '/workspace',
        User: 'root',
        Cmd: ['tail', '-f', '/dev/null'],
        ExposedPorts: DEV_EXPOSED_PORTS,
        HostConfig: {
          Binds: [`${path.resolve(ws.path)}:/workspace:rw`],
          Memory: CONFIG.MEMORY_LIMIT_BYTES,
          NanoCpus: 1000000000,
          PidsLimit: 200,
          NetworkMode: 'bridge',
          PortBindings: DEV_PORT_BINDINGS,
        },
      });

      await container.start();
      ws.containerId = container.id;
      await db.saveWorkspace(ws);
      console.log(`[WorkspaceManager] Docker container created & started: ${container.id} for workspace ${ws.id}`);
      return container.id;
    } catch (dockerErr) {
      console.warn(`[WorkspaceManager] Failed to create Docker container:`, (dockerErr as Error).message);
      return null;
    }
  }

  /**
   * Retrieves or provisions a dedicated, persistent 1-user container & empty workspace.
   */
  public async getOrCreateUserWorkspace(rawUsername: string): Promise<Workspace> {
    const cleanUser = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'developer';
    const workspaceId = `user-${cleanUser}`;
    const workspacePath = path.join(CONFIG.WORKSPACES_DIR, workspaceId);

    let ws = await db.getWorkspaceById(workspaceId);

    // If workspace already exists
    if (ws) {
      this.fsService.watchWorkspace(ws.id, ws.path);
      if (this.executionEngine.isDockerReady()) {
        await this.ensureContainer(ws);
      }
      return ws;
    }

    // New empty workspace
    await fs.mkdir(workspacePath, { recursive: true });
    this.fsService.watchWorkspace(workspaceId, workspacePath);

    let containerId: string | null = null;
    if (this.executionEngine.isDockerReady()) {
      try {
        const containerName = `cloudide-user-${cleanUser}`;
        try {
          const oldContainer = this.docker.getContainer(containerName);
          const inspect = await oldContainer.inspect();
          if (!inspect.State.Running) {
            await oldContainer.start();
          }
          containerId = oldContainer.id;
        } catch {
          const container = await this.createContainerSafe({
            Image: CONFIG.DOCKER_DEFAULT_IMAGE,
            name: containerName,
            Tty: true,
            OpenStdin: true,
            WorkingDir: '/workspace',
            User: 'root', // Full root permissions
            Cmd: ['tail', '-f', '/dev/null'],
            ExposedPorts: DEV_EXPOSED_PORTS,
            HostConfig: {
              Binds: [`${path.resolve(workspacePath)}:/workspace:rw`],
              Memory: CONFIG.MEMORY_LIMIT_BYTES,
              NanoCpus: 1000000000,
              PidsLimit: 200,
              NetworkMode: 'bridge',
              PortBindings: DEV_PORT_BINDINGS,
            },
          });

          await container.start();
          containerId = container.id;
        }
        console.log(`[WorkspaceManager] Dedicated user container ready: ${containerId} for user ${cleanUser}`);
      } catch (dockerErr) {
        console.warn(`[WorkspaceManager] Could not provision user container:`, dockerErr);
      }
    }

    const now = new Date().toISOString();
    ws = {
      id: workspaceId,
      name: `${cleanUser}'s Playground`,
      language: 'javascript',
      status: 'running',
      containerId,
      path: workspacePath,
      template: 'empty',
      createdAt: now,
      updatedAt: now,
    };

    await db.saveWorkspace(ws);
    return ws;
  }

  public async listWorkspaces(): Promise<Workspace[]> {
    return await db.getWorkspaces();
  }

  public async getWorkspace(id: string): Promise<Workspace | null> {
    return await db.getWorkspaceById(id);
  }

  public async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    const id = crypto.randomUUID();
    const workspacePath = path.join(CONFIG.WORKSPACES_DIR, id);

    // Initialize files on disk
    await this.fsService.initStarterWorkspace(workspacePath, dto.language, dto.template);

    // Start watching filesystem
    this.fsService.watchWorkspace(id, workspacePath);

    let containerId: string | null = null;
    let status: Workspace['status'] = 'running';

    // If Docker is running, create an isolated container
    if (this.executionEngine.isDockerReady()) {
      try {
        const container = (await this.docker.createContainer({
          Image: CONFIG.DOCKER_DEFAULT_IMAGE,
          name: `cloudide-${id}`,
          Tty: true,
          OpenStdin: true,
          WorkingDir: '/workspace',
          User: 'node',
          Cmd: ['tail', '-f', '/dev/null'],
          HostConfig: {
            Binds: [`${path.resolve(workspacePath)}:/workspace:rw`],
            Memory: CONFIG.MEMORY_LIMIT_BYTES,
            NanoCpus: 500000000,
            PidsLimit: 50,
            NetworkMode: 'bridge',
          },
        })) as Docker.Container;

        await container.start();
        containerId = container.id;
        console.log(`[WorkspaceManager] Docker container created: ${container.id} for workspace ${id}`);
      } catch (dockerErr) {
        console.warn(`[WorkspaceManager] Failed to create Docker container (falling back to sandbox):`, (dockerErr as Error).message);
      }
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id,
      name: dto.name || `workspace-${id.slice(0, 6)}`,
      language: dto.language,
      status,
      containerId,
      path: workspacePath,
      template: dto.template || 'starter',
      createdAt: now,
      updatedAt: now,
    };

    await db.saveWorkspace(workspace);
    return workspace;
  }

  public async startWorkspace(id: string): Promise<Workspace | null> {
    const ws = await db.getWorkspaceById(id);
    if (!ws) return null;

    if (ws.containerId && this.executionEngine.isDockerReady()) {
      try {
        const container = this.docker.getContainer(ws.containerId);
        await container.start();
      } catch (err) {
        console.warn(`[WorkspaceManager] Container start error:`, err);
      }
    }

    // Ensure watcher is running
    this.fsService.watchWorkspace(ws.id, ws.path);

    ws.status = 'running';
    ws.updatedAt = new Date().toISOString();
    await db.saveWorkspace(ws);
    return ws;
  }

  public async stopWorkspace(id: string): Promise<Workspace | null> {
    const ws = await db.getWorkspaceById(id);
    if (!ws) return null;

    if (ws.containerId && this.executionEngine.isDockerReady()) {
      try {
        const container = this.docker.getContainer(ws.containerId);
        await container.stop();
      } catch (err) {
        console.warn(`[WorkspaceManager] Container stop error:`, err);
      }
    }

    ws.status = 'stopped';
    ws.updatedAt = new Date().toISOString();
    await db.saveWorkspace(ws);
    return ws;
  }

  public async deleteWorkspace(id: string): Promise<boolean> {
    const ws = await db.getWorkspaceById(id);
    if (!ws) return false;

    // Unwatch filesystem
    this.fsService.unwatchWorkspace(id);

    // Remove Docker container if present
    if (ws.containerId && this.executionEngine.isDockerReady()) {
      try {
        const container = this.docker.getContainer(ws.containerId);
        await container.stop().catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      } catch (err) {
        console.warn(`[WorkspaceManager] Error cleaning up container:`, err);
      }
    }

    // Remove workspace files on disk
    try {
      await fs.rm(ws.path, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[WorkspaceManager] Error deleting files at ${ws.path}:`, err);
    }

    await db.deleteWorkspace(id);
    return true;
  }

  private async createContainerSafe(options: Docker.ContainerCreateOptions): Promise<Docker.Container> {
    try {
      return (await this.docker.createContainer(options)) as Docker.Container;
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('port is already allocated') || msg.includes('bind')) {
        console.warn('[WorkspaceManager] Port collision during container creation, falling back without conflicting ports:', msg);
        const fallbackOpts: Docker.ContainerCreateOptions = {
          ...options,
          HostConfig: {
            ...options.HostConfig,
            PortBindings: {},
          },
        };
        return (await this.docker.createContainer(fallbackOpts)) as Docker.Container;
      }
      throw err;
    }
  }
}
