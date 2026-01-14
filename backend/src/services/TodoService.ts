import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TodoItem, CreateTodoRequest, UpdateTodoRequest, PaginatedResponse } from '../types/TodoItem';
import { validateCreateTodoRequest, validateUpdateTodoRequest, validateTodoId } from '../utils/validation';

export class TodoService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.TODO_TABLE_NAME || 'TodoItems';
  }

  async createTodo(request: CreateTodoRequest): Promise<TodoItem> {
    console.log('Creating todo:', JSON.stringify(request));
    
    validateCreateTodoRequest(request);

    const now = new Date().toISOString();
    const todoItem: TodoItem = {
      id: uuidv4(),
      title: request.title.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: todoItem
      }));

      console.log('Todo created successfully:', todoItem.id);
      return todoItem;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw new Error('Failed to create todo item');
    }
  }

  async getTodo(id: string): Promise<TodoItem | null> {
    console.log('Getting todo:', id);
    
    validateTodoId(id);

    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      if (!result.Item) {
        console.log('Todo not found:', id);
        return null;
      }

      console.log('Todo retrieved successfully:', id);
      return result.Item as TodoItem;
    } catch (error) {
      console.error('Error getting todo:', error);
      throw new Error('Failed to retrieve todo item');
    }
  }

  async getAllTodos(limit: number = 50, exclusiveStartKey?: string): Promise<PaginatedResponse<TodoItem>> {
    console.log(`Getting todos with limit: ${limit}, startKey: ${exclusiveStartKey ? 'provided' : 'none'}`);
    
    // Enforce maximum limit to prevent abuse (max 100 items per request)
    const effectiveLimit = Math.min(Math.max(limit, 1), 100);
    
    if (effectiveLimit !== limit) {
      console.log(`Limit adjusted from ${limit} to ${effectiveLimit}`);
    }

    try {
      const scanParams: any = {
        TableName: this.tableName,
        Limit: effectiveLimit,
        // ProjectionExpression to reduce data transfer and improve performance
        ProjectionExpression: 'id, title, completed, createdAt, updatedAt'
      };
      
      // Add pagination token if provided
      if (exclusiveStartKey) {
        try {
          scanParams.ExclusiveStartKey = JSON.parse(
            Buffer.from(exclusiveStartKey, 'base64').toString('utf-8')
          );
          console.log('Decoded pagination token successfully');
        } catch (error) {
          console.error('Invalid pagination token:', error);
          throw new Error('Invalid pagination token');
        }
      }
      
      const result = await this.docClient.send(new ScanCommand(scanParams));

      const todos = (result.Items || []) as TodoItem[];
      console.log(`Retrieved ${todos.length} todos`);
      
      // Sort by creation date, newest first (only sorts current page)
      const sortedTodos = todos.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Encode nextToken for pagination
      const nextToken = result.LastEvaluatedKey 
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;
      
      const hasMore = !!nextToken;
      
      console.log(`Returning ${sortedTodos.length} todos, hasMore: ${hasMore}`);
      
      return {
        items: sortedTodos,
        nextToken,
        count: sortedTodos.length,
        limit: effectiveLimit,
        hasMore
      };
    } catch (error) {
      console.error('Error getting all todos:', error);
      throw new Error('Failed to retrieve todo items');
    }
  }

  async updateTodo(id: string, request: UpdateTodoRequest): Promise<TodoItem | null> {
    console.log('Updating todo:', id, JSON.stringify(request));
    
    validateTodoId(id);
    validateUpdateTodoRequest(request);

    // Check if todo exists first
    const existingTodo = await this.getTodo(id);
    if (!existingTodo) {
      return null;
    }

    const now = new Date().toISOString();
    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    if (request.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = request.title.trim();
    }

    if (request.completed !== undefined) {
      updateExpression.push('completed = :completed');
      expressionAttributeValues[':completed'] = request.completed;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    try {
      const result = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ReturnValues: 'ALL_NEW'
      }));

      console.log('Todo updated successfully:', id);
      return result.Attributes as TodoItem;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('Failed to update todo item');
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    console.log('Deleting todo:', id);
    
    validateTodoId(id);

    // Check if todo exists first
    const existingTodo = await this.getTodo(id);
    if (!existingTodo) {
      return false;
    }

    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      console.log('Todo deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw new Error('Failed to delete todo item');
    }
  }
}