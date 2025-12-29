import React from 'react';
import { useTodos } from '../hooks/useTodos';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export const TodoApp: React.FC = () => {
  const { todos, loading, error, createTodo, updateTodo, deleteTodo, refreshTodos } = useTodos();

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Todo App</h1>
        <p>Manage your tasks efficiently</p>
      </header>

      <main className="todo-main">
        <AddTodo onCreateTodo={createTodo} />
        
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={refreshTodos}
          />
        )}
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <TodoList 
            todos={todos}
            onUpdateTodo={updateTodo}
            onDeleteTodo={deleteTodo}
          />
        )}
      </main>

      <footer className="todo-footer">
        <p>
          {todos.length === 0 
            ? 'No todos yet. Add one above!' 
            : `${todos.filter(t => !t.completed).length} of ${todos.length} tasks remaining`
          }
        </p>
      </footer>
    </div>
  );
};