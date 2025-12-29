import React, { useState } from 'react';
import { CreateTodoRequest } from '../types/Todo';

interface AddTodoProps {
  onCreateTodo: (request: CreateTodoRequest) => Promise<void>;
}

export const AddTodo: React.FC<AddTodoProps> = ({ onCreateTodo }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError(null);
    
    // Validate input
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please enter a todo title');
      return;
    }

    if (trimmedTitle.length > 500) {
      setValidationError('Todo title cannot exceed 500 characters');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onCreateTodo({ title: trimmedTitle });
      setTitle(''); // Clear input on success
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          value={title}
          onChange={handleInputChange}
          placeholder="What needs to be done?"
          className={`todo-input ${validationError ? 'error' : ''}`}
          disabled={isSubmitting}
          maxLength={500}
          autoFocus
        />
        <button 
          type="submit" 
          className="add-button"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add Todo'}
        </button>
      </div>
      
      {validationError && (
        <div className="validation-error">
          {validationError}
        </div>
      )}
      
      <div className="character-count">
        {title.length}/500
      </div>
    </form>
  );
};