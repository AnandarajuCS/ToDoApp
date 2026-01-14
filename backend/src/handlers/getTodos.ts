import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { Logger } from '../utils/logger';
import {
  createSuccessResponse,
  createInternalServerErrorResponse,
  createBadRequestResponse
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
    // Extract pagination parameters from query string
    const limitParam = event.queryStringParameters?.limit;
    const nextToken = event.queryStringParameters?.nextToken;
    
    // Parse and validate limit parameter (default: 50, max: 100)
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      Logger.warn('Invalid limit parameter', { 
        ...requestContext, 
        limit: limitParam 
      });
      return createBadRequestResponse('Limit must be between 1 and 100');
    }
    
    const result = await todoService.getAllTodos(limit, nextToken);
    
    Logger.info('Todos retrieved successfully', { 
      ...requestContext, 
      count: result.count,
      hasMore: result.hasMore
    });
    return createSuccessResponse(result);
  } catch (error) {
    Logger.error('Error in getTodos handler', error as Error, requestContext);
    return createInternalServerErrorResponse('Failed to retrieve todos');
  }
};