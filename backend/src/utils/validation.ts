import { CreateTodoRequest, UpdateTodoRequest, TodoValidationError, TodoValidationException } from '../types/TodoItem';

export function validateCreateTodoRequest(request: CreateTodoRequest): void {
  const errors: TodoValidationError[] = [];

  if (!request.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (typeof request.title !== 'string') {
    errors.push({ field: 'title', message: 'Title must be a string' });
  } else if (request.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title cannot be empty or whitespace only' });
  } else if (Buffer.byteLength(request.title, 'utf8') > 500) {
    errors.push({ field: 'title', message: 'Title cannot exceed 500 bytes' });
  }

  if (errors.length > 0) {
    throw new TodoValidationException(errors);
  }
}

export function validateUpdateTodoRequest(request: UpdateTodoRequest): void {
  const errors: TodoValidationError[] = [];

  if (request.title !== undefined) {
    if (typeof request.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else if (request.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty or whitespace only' });
    } else if (Buffer.byteLength(request.title, 'utf8') > 500) {
      errors.push({ field: 'title', message: 'Title cannot exceed 500 bytes' });
    }
  }

  if (request.completed !== undefined && typeof request.completed !== 'boolean') {
    errors.push({ field: 'completed', message: 'Completed must be a boolean' });
  }

  if (errors.length > 0) {
    throw new TodoValidationException(errors);
  }
}

export function validateTodoId(id: string): void {
  const errors: TodoValidationError[] = [];

  if (!id) {
    errors.push({ field: 'id', message: 'ID is required' });
  } else if (typeof id !== 'string') {
    errors.push({ field: 'id', message: 'ID must be a string' });
  } else if (id.trim().length === 0) {
    errors.push({ field: 'id', message: 'ID cannot be empty' });
  }

  if (errors.length > 0) {
    throw new TodoValidationException(errors);
  }
}