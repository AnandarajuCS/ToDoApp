import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { CreateTodoRequest } from '../types/TodoItem';
import { TodoValidationException } from '../types/TodoItem';
import { Logger } from '../utils/logger';
import {
  createCreatedResponse,
  createBadRequestResponse,
  createUnauthorizedResponse,
  createInternalServerErrorResponse
} from '../utils/response';

const todoService = new TodoService();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestContext = {
    requestId: context.awsRequestId,
    operation: 'createTodo'
  };

  Logger.info('CreateTodo Lambda invoked', {
    ...requestContext,
    httpMethod: event.httpMethod,
    path: event.path
  });

  try {
  // Extract userId from Cognito authorizer claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    Logger.error('User ID not found in request context', new Error('Missing user identity'), requestContext);
    return createUnauthorizedResponse('Authentication required');
  }

  Logger.info('Authenticated user', { 
    ...requestContext, 
    userId 
  });

    if (!event.body) {
      Logger.warn('Request body missing', requestContext);
      return createBadRequestResponse('Request body is required');
    }

    let request: CreateTodoRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      Logger.warn('Invalid JSON in request body', { ...requestContext, body: event.body });
      return createBadRequestResponse('Invalid JSON in request body');
    }

    const todo = await todoService.createTodo(userId, request);
    
    Logger.info('Todo created successfully', { 
      ...requestContext, 
      userId,
      todoId: todo.id,
      title: todo.title 
    });
    return createCreatedResponse(todo);

  } catch (error) {
    if (error instanceof TodoValidationException) {
      Logger.warn('Validation failed', { ...requestContext, errors: error.errors });
      return createBadRequestResponse('Validation failed', error.errors);
    }

    Logger.error('Error in createTodo handler', error as Error, requestContext);
    return createInternalServerErrorResponse('Failed to create todo');
  }
};