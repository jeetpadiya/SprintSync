export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string | null;
  avatarUrl?: string | null;
  workspaces?: WorkspaceSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, string[]>;
}
