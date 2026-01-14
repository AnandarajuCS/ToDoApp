import { CreateTodoRequest, UpdateTodoRequest, TodoValidationError, TodoValidationException } from '../types/TodoItem';

export function validateCreateTodoRequest(request: CreateTodoRequest): void {
  const errors: TodoValidationError[] = [];

  if (!request.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (typeof request.title !== 'string') {
    errors.push({ field: 'title', message: 'Title must be a string' });
  } else if (request.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title cannot be empty or whitespace only' });
  } else if (request.title.length > 500) {
    errors.push({ field: 'title', message: 'Title cannot exceed 500 characters' });
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
    } else if (request.title.length > 500) {
      errors.push({ field: 'title', message: 'Title cannot exceed 500 characters' });
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
  } else {
    // UUID v4 format validation: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, a, or b
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidV4Pattern.test(id)) {
      errors.push({ 
        field: 'id', 
        message: 'ID must be a valid UUID v4 format' 
      });
    }
  }

  if (errors.length > 0) {
    throw new TodoValidationException(errors);
  }
}