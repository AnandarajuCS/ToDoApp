export interface TodoItem {
  id: string;           // UUID v4 - Partition key
  title: string;        // Todo description (1-500 characters)
  completed: boolean;   // Completion status
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

export interface TodoValidationError {
  field: string;
  message: string;
}

export class TodoValidationException extends Error {
  public errors: TodoValidationError[];

  constructor(errors: TodoValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'TodoValidationException';
  }
}