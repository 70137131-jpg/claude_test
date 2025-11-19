export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ChatMessageCreateInput {
  projectId: string;
  userId: string;
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  message: string;
  projectId?: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
}
