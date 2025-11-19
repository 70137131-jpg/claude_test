export enum ReviewStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Review {
  id: string;
  projectId: string;
  userId: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCreateInput {
  projectId: string;
  userId: string;
}

export interface ReviewUpdateInput {
  status?: ReviewStatus;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  filePath: string;
  line: number;
  content: string;
  createdAt: Date;
}

export interface ReviewCommentCreateInput {
  reviewId: string;
  userId: string;
  filePath: string;
  line: number;
  content: string;
}
