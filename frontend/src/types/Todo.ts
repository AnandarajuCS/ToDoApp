export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  idempotencyToken?: string;
}

export interface CreateTodoRequest {
  title: string;
  idempotencyToken?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

export interface ApiError {
  error: string;
  details?: any;
}