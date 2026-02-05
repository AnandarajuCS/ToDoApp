import { Todo, CreateTodoRequest, UpdateTodoRequest, ApiError } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';

class TodoApiService {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    // In production, this would be set via environment variables
    // For now, we'll use a placeholder that will be replaced during deployment
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://f0nr9zgwv0.execute-api.us-east-1.amazonaws.com/prod';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`Making request to: ${url}`, config);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        
        throw new Error(errorMessage);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      console.log(`Response from ${url}:`, data);
      return data;

    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      
      // Retry logic for network errors
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retrying request (${retryCount + 1}/${this.maxRetries}) after ${this.retryDelay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, but not on client errors (4xx)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    
    if (error.message.includes('HTTP 5')) {
      return true; // Server error
    }
    
    return false;
  }

  async createTodo(request: CreateTodoRequest): Promise<Todo> {
    // Generate idempotency token for this create request
    // This ensures retries use the same token to prevent duplicates
    const idempotencyToken = uuidv4();
    
    const requestWithToken = {
      ...request,
      idempotencyToken
    };

    return this.makeRequest<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(requestWithToken),
    });
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.makeRequest<Todo[]>('/todos', {
      method: 'GET',
    });
  }

  async getTodo(id: string): Promise<Todo> {
    return this.makeRequest<Todo>(`/todos/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async updateTodo(id: string, request: UpdateTodoRequest): Promise<Todo> {
    return this.makeRequest<Todo>(`/todos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.makeRequest<void>(`/todos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<Todo[]>('/todos', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  // Update base URL (useful for testing or environment changes)
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const todoApi = new TodoApiService();