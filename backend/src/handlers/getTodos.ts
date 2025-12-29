import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { Logger } from '../utils/logger';
import {
  createSuccessResponse,
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

  try {
    const todos = await todoService.getAllTodos();
    
    Logger.info('Todos retrieved successfully', { 
      ...requestContext, 
      count: todos.length 
    });
    return createSuccessResponse(todos);

  } catch (error) {
    Logger.error('Error in getTodos handler', error as Error, requestContext);
    return createInternalServerErrorResponse('Failed to retrieve todos');
  }
};