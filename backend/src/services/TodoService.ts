import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../types/TodoItem';
import { validateCreateTodoRequest, validateUpdateTodoRequest, validateTodoId } from '../utils/validation';

export class TodoService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private userIdIndexName: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.TODO_TABLE_NAME || 'TodoItems';
    this.userIdIndexName = process.env.USER_ID_INDEX_NAME || 'UserIdIndex';
  }

  async createTodo(userId: string, request: CreateTodoRequest): Promise<TodoItem> {
    console.log('Creating todo for user:', userId, JSON.stringify(request));
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    validateCreateTodoRequest(request);

    const now = new Date().toISOString();
    const todoItem: TodoItem = {
      id: uuidv4(),
      userId,
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

  async getTodo(userId: string, id: string): Promise<TodoItem | null> {
    console.log('Getting todo for user:', userId, 'id:', id);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
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

      const todo = result.Item as TodoItem;
      
      // Verify ownership
      if (todo.userId !== userId) {
        console.log('Access denied: Todo does not belong to user');
        return null;
      }

      console.log('Todo retrieved successfully for user:', userId);
      return todo;
    } catch (error) {
      console.error('Error getting todo:', error);
      throw new Error('Failed to retrieve todo item');
    }
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos for user:', userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: this.userIdIndexName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort by createdAt descending (newest first)
      }));

      const todos = (result.Items || []) as TodoItem[];
      console.log(`Retrieved ${todos.length} todos for user:`, userId);
      return todos;
    } catch (error) {
      console.error('Error getting all todos:', error);
      throw new Error('Failed to retrieve todo items');
    }
  }

  async updateTodo(userId: string, id: string, request: UpdateTodoRequest): Promise<TodoItem | null> {
    console.log('Updating todo for user:', userId, 'id:', id, JSON.stringify(request));
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    validateTodoId(id);
    validateUpdateTodoRequest(request);

    // Check if todo exists first
    const existingTodo = await this.getTodo(userId, id);
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

  async deleteTodo(userId: string, id: string): Promise<boolean> {
    console.log('Deleting todo for user:', userId, 'id:', id);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    validateTodoId(id);

    // Check if todo exists first
    const existingTodo = await this.getTodo(userId, id);
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
import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../types/TodoItem';
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

  async getAllTodos(): Promise<TodoItem[]> {
    console.log('Getting all todos');

    try {
      const result = await this.docClient.send(new ScanCommand({
        TableName: this.tableName
      }));

      const todos = (result.Items || []) as TodoItem[];
      console.log(`Retrieved ${todos.length} todos`);
      
      // Sort by creation date, newest first
      return todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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