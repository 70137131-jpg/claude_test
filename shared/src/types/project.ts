export enum ProjectStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repositoryUrl?: string;
  localPath?: string;
  userId: string;
  status: ProjectStatus;
  fileCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  repositoryUrl?: string;
  localPath?: string;
  userId: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  fileCount?: number;
}
