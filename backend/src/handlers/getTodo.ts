import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { TodoValidationException } from '../types/TodoItem';
import {
  createSuccessResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createInternalServerErrorResponse
} from '../utils/response';

const todoService = new TodoService();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('GetTodo Lambda invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters
  });

  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return createBadRequestResponse('Todo ID is required');
    }

    const todo = await todoService.getTodo(id);
    
    if (!todo) {
      console.log('Todo not found', { todoId: id });
      return createNotFoundResponse('Todo not found');
    }

    console.log('Todo retrieved successfully', { todoId: id });
    return createSuccessResponse(todo);

  } catch (error) {
    console.error('Error in getTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }

    return createInternalServerErrorResponse('Failed to retrieve todo');
  }
};