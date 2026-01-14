import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import {
  createSuccessResponse,
  createInternalServerErrorResponse
} from '../utils/response';

const todoService = new TodoService();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('HealthCheck Lambda invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path
  });

  try {
    // Test database connectivity with minimal resource consumption
    await todoService.checkDatabaseConnection();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'todo-api',
      version: '1.0.0',
      checks: {
        database: 'healthy',
        api: 'healthy'
      }
    };

    console.log('Health check passed', healthStatus);
    return createSuccessResponse(healthStatus);

  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'todo-api',
      version: '1.0.0',
      checks: {
        database: 'unhealthy',
        api: 'healthy'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return createInternalServerErrorResponse('Service unhealthy');
  }
};