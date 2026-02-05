import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { Logger } from '../utils/logger';
import {
  createSuccessResponse,
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
    operation: 'getTodos'
  };

  Logger.info('GetTodos Lambda invoked', {
    ...requestContext,
    httpMethod: event.httpMethod,
    path: event.path
  });

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

  try {
    const todos = await todoService.getAllTodos(userId);
    
    Logger.info('Todos retrieved successfully', { 
      ...requestContext, 
      userId,
      count: todos.length 
    });
    return createSuccessResponse(todos);

  } catch (error) {
    Logger.error('Error in getTodos handler', error as Error, requestContext);
    return createInternalServerErrorResponse('Failed to retrieve todos');
  }
};