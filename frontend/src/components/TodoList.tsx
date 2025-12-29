import React from 'react';
import { Todo, UpdateTodoRequest } from '../types/Todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onUpdateTodo: (id: string, request: UpdateTodoRequest) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
}

export const TodoList: React.FC<TodoListProps> = ({ 
  todos, 
  onUpdateTodo, 
  onDeleteTodo 
}) => {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No todos yet</h3>
        <p>Add your first todo above to get started!</p>
      </div>
    );
  }

  // Separate completed and incomplete todos
  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div className="todo-list">
      {incompleteTodos.length > 0 && (
        <section className="todo-section">
          <h3 className="section-title">
            Active Tasks ({incompleteTodos.length})
          </h3>
          <ul className="todo-items">
            {incompleteTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdateTodo={onUpdateTodo}
                onDeleteTodo={onDeleteTodo}
              />
            ))}
          </ul>
        </section>
      )}

      {completedTodos.length > 0 && (
        <section className="todo-section completed-section">
          <h3 className="section-title">
            Completed Tasks ({completedTodos.length})
          </h3>
          <ul className="todo-items">
            {completedTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdateTodo={onUpdateTodo}
                onDeleteTodo={onDeleteTodo}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};