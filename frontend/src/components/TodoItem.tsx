import React, { useState } from 'react';
import { Todo, UpdateTodoRequest } from '../types/Todo';

interface TodoItemProps {
  todo: Todo;
  onUpdateTodo: (id: string, request: UpdateTodoRequest) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
}

export const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onUpdateTodo, 
  onDeleteTodo 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleComplete = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdateTodo(todo.id, { completed: !todo.completed });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDeleteTodo(todo.id);
    } catch (error) {
      // Error is handled by parent component
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <button
          className={`toggle-button ${todo.completed ? 'checked' : ''}`}
          onClick={handleToggleComplete}
          disabled={isUpdating}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isUpdating ? (
            <span className="spinner">⟳</span>
          ) : (
            <span className="checkmark">{todo.completed ? '✓' : ''}</span>
          )}
        </button>

        <div className="todo-text">
          <span className={`todo-title ${todo.completed ? 'strikethrough' : ''}`}>
            {todo.title}
          </span>
          <span className="todo-date">
            Created {formatDate(todo.createdAt)}
            {todo.updatedAt !== todo.createdAt && (
              <span> • Updated {formatDate(todo.updatedAt)}</span>
            )}
          </span>
        </div>

        <div className="todo-actions">
          {!showDeleteConfirm ? (
            <button
              className="delete-button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              aria-label="Delete todo"
            >
              🗑️
            </button>
          ) : (
            <div className="delete-confirm">
              <span className="confirm-text">Delete?</span>
              <button
                className="confirm-yes"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                className="confirm-no"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};