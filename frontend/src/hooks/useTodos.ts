import { useState, useEffect, useCallback } from 'react';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/Todo';
import { todoApi } from '../services/todoApi';

export interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  createTodo: (request: CreateTodoRequest) => Promise<void>;
  updateTodo: (id: string, request: UpdateTodoRequest) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

export const useTodos = (): UseTodosReturn => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTodos = await todoApi.getAllTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = useCallback(async (request: CreateTodoRequest) => {
    setError(null);
    try {
      const newTodo = await todoApi.createTodo(request);
      setTodos(prev => [newTodo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
      throw err;
    }
  }, []);

  const updateTodo = useCallback(async (id: string, request: UpdateTodoRequest) => {
    setError(null);
    try {
      const updatedTodo = await todoApi.updateTodo(id, request);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
      throw err;
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    setError(null);
    try {
      await todoApi.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshTodos();
  }, [refreshTodos]);

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    refreshTodos,
  };
};