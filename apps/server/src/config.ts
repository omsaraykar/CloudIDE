import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://cloudide:cloudide_password@localhost:5432/cloudide_db?schema=public',
  // Workspaces directory where workspace files are persisted on host
  WORKSPACES_DIR: process.env.WORKSPACES_DIR || path.resolve(__dirname, '../../workspaces_storage'),
  // Docker settings
  DOCKER_SOCKET: process.platform === 'win32' 
    ? '//./pipe/docker_engine' 
    : '/var/run/docker.sock',
  DOCKER_DEFAULT_IMAGE: process.env.DOCKER_IMAGE || 'node:22-alpine',
  EXECUTION_TIMEOUT_MS: parseInt(process.env.EXECUTION_TIMEOUT_MS || '15000', 10),
  MEMORY_LIMIT_BYTES: 256 * 1024 * 1024, // 256MB
  CPU_QUOTA: 50000, // 50% CPU limit
};
