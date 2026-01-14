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

    // Check for idempotency token - if provided, check if todo already exists with this token
    if (request.idempotencyToken) {
      console.log('Idempotency token provided:', request.idempotencyToken);
      
      try {
        // Scan for existing todo with this idempotency token
        const existingTodoResult = await this.docClient.send(new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'idempotencyToken = :token',
          ExpressionAttributeValues: {
            ':token': request.idempotencyToken
          },
          Limit: 1
        }));

        if (existingTodoResult.Items && existingTodoResult.Items.length > 0) {
          const existingTodo = existingTodoResult.Items[0] as TodoItem;
          console.log('Idempotent request detected - returning existing todo:', existingTodo.id);
          return existingTodo;
        }
      } catch (error) {
        console.error('Error checking idempotency token:', error);
        // Continue with creation if idempotency check fails (fail open)
      }
    }

    const now = new Date().toISOString();
    const todoItem: TodoItem = {
      id: uuidv4(),
      title: request.title.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
      idempotencyToken: request.idempotencyToken
    };

    try {
      // Use conditional expression to prevent overwriting if ID somehow already exists
      const putParams: any = {
        TableName: this.tableName,
        Item: todoItem,
        ConditionExpression: 'attribute_not_exists(id)'
      };

      await this.docClient.send(new PutCommand(putParams));

      console.log('Todo created successfully:', todoItem.id);
      return todoItem;
    } catch (error) {
      // Check if this is a conditional check failure (race condition)
      if ((error as any).name === 'ConditionalCheckFailedException') {
        console.warn('Conditional check failed - todo ID already exists (race condition):', todoItem.id);
        // In case of race condition with same idempotency token, try to retrieve the existing item
        const existingTodo = await this.getTodo(todoItem.id);
        if (existingTodo) return existingTodo;
      }
      
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