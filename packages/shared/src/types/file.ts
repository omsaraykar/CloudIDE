export type FileType = 'file' | 'directory';

export interface FileNode {
  id: string; // usually relative path or unique path
  name: string;
  path: string; // relative path from workspace root
  type: FileType;
  children?: FileNode[];
  size?: number;
  extension?: string;
  updatedAt?: string;
}

export interface FileContent {
  path: string;
  content: string;
  language?: string;
}

export interface SaveFileDto {
  path: string;
  content: string;
}

export interface CreateFileDto {
  path: string;
  type: FileType;
  content?: string;
}

export interface RenameFileDto {
  oldPath: string;
  newPath: string;
}

export interface DeleteFileDto {
  path: string;
}

export type FileSystemEventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

export interface FileSystemChangeEvent {
  workspaceId: string;
  type: FileSystemEventType;
  path: string;
  timestamp: number;
}
