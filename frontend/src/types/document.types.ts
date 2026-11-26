export interface DocumentCreator {
  id: string;
  name: string;
  email: string;
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  teamId?: string | null;
  title: string;
  icon?: string | null;
  content?: Record<string, unknown> | null;
  creatorId?: string | null;
  updatedBy?: string | null;
  creator?: DocumentCreator | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title?: string;
  teamId?: string | null;
  icon?: string | null;
  content?: Record<string, unknown> | null;
}

export interface UpdateDocumentInput {
  title?: string;
  teamId?: string | null;
  icon?: string | null;
  content?: Record<string, unknown> | null;
}
