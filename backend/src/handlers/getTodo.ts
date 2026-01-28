import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { TodoValidationException } from '../types/TodoItem';
import {
  createSuccessResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createUnauthorizedResponse,
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
  // Extract userId from Cognito authorizer claims
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    console.error('User ID not found in request context');
    return createUnauthorizedResponse('Authentication required');
  }

  console.log('Authenticated user:', userId);

    const id = event.pathParameters?.id;
    if (!id) {
      return createBadRequestResponse('Todo ID is required');
    }

    const todo = await todoService.getTodo(id);
    const todo = await todoService.getTodo(userId, id);
    if (!todo) {
      console.log('Todo not found', { todoId: id });
      // Todo not found or access denied (user doesn't own the todo)
      console.log('Todo not found or access denied', { 
        todoId: id, 
        userId 
      });
    }

    console.log('Todo retrieved successfully', { todoId: id });
    console.log('Todo retrieved successfully', { 
      todoId: id, 
      userId 
    });

  } catch (error) {
    console.error('Error in getTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }

    return createInternalServerErrorResponse('Failed to retrieve todo');
  }
};