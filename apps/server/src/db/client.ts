import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import type { Workspace, ExecutionResult } from '@cloud-ide/shared';
import { CONFIG } from '../config.js';

let prismaInstance: PrismaClient | null = null;
let useDatabase = false;

try {
  prismaInstance = new PrismaClient();
} catch (e) {
  console.warn('[DB] Prisma initialization deferred:', (e as Error).message);
}

// Local fallback store file
const FALLBACK_STORE_FILE = path.join(CONFIG.WORKSPACES_DIR, '.workspaces_meta.json');

interface FallbackStore {
  workspaces: Workspace[];
  executions: Record<string, ExecutionResult[]>;
}

async function loadFallbackStore(): Promise<FallbackStore> {
  try {
    await fs.mkdir(CONFIG.WORKSPACES_DIR, { recursive: true });
    const content = await fs.readFile(FALLBACK_STORE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const initial: FallbackStore = { workspaces: [], executions: {} };
    await fs.writeFile(FALLBACK_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

async function saveFallbackStore(store: FallbackStore): Promise<void> {
  try {
    await fs.mkdir(CONFIG.WORKSPACES_DIR, { recursive: true });
    await fs.writeFile(FALLBACK_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save fallback store:', err);
  }
}

export const db = {
  async init(): Promise<void> {
    if (!prismaInstance) return;
    try {
      // Test Prisma connection
      await prismaInstance.$connect();
      useDatabase = true;
      console.log('[DB] Connected to PostgreSQL via Prisma successfully');
    } catch (err) {
      useDatabase = false;
      console.warn('[DB] PostgreSQL unavailable at DATABASE_URL, using persistent local metadata store fallback.');
    }
  },

  async getWorkspaces(): Promise<Workspace[]> {
    if (useDatabase && prismaInstance) {
      try {
        const rows = await prismaInstance.workspace.findMany({
          orderBy: { updatedAt: 'desc' },
        });
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          language: r.language as any,
          status: r.status as any,
          containerId: r.containerId,
          path: r.path,
          template: r.template || undefined,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('[DB] Error querying Postgres workspaces, falling back to local store:', (err as Error).message);
      }
    }
    const store = await loadFallbackStore();
    return store.workspaces;
  },

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    if (useDatabase && prismaInstance) {
      try {
        const r = await prismaInstance.workspace.findUnique({ where: { id } });
        if (r) {
          return {
            id: r.id,
            name: r.name,
            language: r.language as any,
            status: r.status as any,
            containerId: r.containerId,
            path: r.path,
            template: r.template || undefined,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('[DB] Error querying workspace from Postgres:', (err as Error).message);
      }
    }
    const store = await loadFallbackStore();
    return store.workspaces.find((w) => w.id === id) || null;
  },

  async saveWorkspace(workspace: Workspace): Promise<void> {
    if (useDatabase && prismaInstance) {
      try {
        await prismaInstance.workspace.upsert({
          where: { id: workspace.id },
          create: {
            id: workspace.id,
            name: workspace.name,
            language: workspace.language,
            status: workspace.status,
            containerId: workspace.containerId,
            path: workspace.path,
            template: workspace.template,
            createdAt: new Date(workspace.createdAt),
            updatedAt: new Date(workspace.updatedAt),
          },
          update: {
            name: workspace.name,
            language: workspace.language,
            status: workspace.status,
            containerId: workspace.containerId,
            path: workspace.path,
            template: workspace.template,
            updatedAt: new Date(workspace.updatedAt),
          },
        });
        return;
      } catch (err) {
        console.warn('[DB] Error saving workspace to Postgres, writing to local store:', (err as Error).message);
      }
    }
    const store = await loadFallbackStore();
    const idx = store.workspaces.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) {
      store.workspaces[idx] = workspace;
    } else {
      store.workspaces.unshift(workspace);
    }
    await saveFallbackStore(store);
  },

  async deleteWorkspace(id: string): Promise<void> {
    if (useDatabase && prismaInstance) {
      try {
        await prismaInstance.workspace.delete({ where: { id } }).catch(() => null);
      } catch {
        // ignore
      }
    }
    const store = await loadFallbackStore();
    store.workspaces = store.workspaces.filter((w) => w.id !== id);
    delete store.executions[id];
    await saveFallbackStore(store);
  },

  async recordExecution(result: ExecutionResult): Promise<void> {
    if (useDatabase && prismaInstance) {
      try {
        await prismaInstance.execution.create({
          data: {
            id: result.executionId,
            workspaceId: result.workspaceId,
            filePath: result.filePath,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            durationMs: result.durationMs,
            success: result.success,
          },
        });
        return;
      } catch {
        // ignore
      }
    }
    const store = await loadFallbackStore();
    if (!store.executions[result.workspaceId]) {
      store.executions[result.workspaceId] = [];
    }
    store.executions[result.workspaceId].unshift(result);
    // keep last 50
    if (store.executions[result.workspaceId].length > 50) {
      store.executions[result.workspaceId].pop();
    }
    await saveFallbackStore(store);
  },

  async getExecutions(workspaceId: string): Promise<ExecutionResult[]> {
    if (useDatabase && prismaInstance) {
      try {
        const rows = await prismaInstance.execution.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        return rows.map((r: any) => ({
          executionId: r.id,
          workspaceId: r.workspaceId,
          filePath: r.filePath,
          exitCode: r.exitCode,
          stdout: r.stdout,
          stderr: r.stderr,
          durationMs: r.durationMs,
          success: r.success,
        }));
      } catch {
        // ignore
      }
    }
    const store = await loadFallbackStore();
    return store.executions[workspaceId] || [];
  },
};
