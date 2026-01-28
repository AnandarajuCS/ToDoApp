import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { TodoValidationException } from '../types/TodoItem';
import {
  createNoContentResponse,
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
  console.log('DeleteTodo Lambda invoked', {
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

    const deleted = await todoService.deleteTodo(id);
    const deleted = await todoService.deleteTodo(userId, id);
    if (!deleted) {
      console.log('Todo not found for deletion', { todoId: id });
      // Todo not found or access denied
      console.log('Todo not found or access denied for deletion', { 
        todoId: id, 
        userId 
      });
    }

    console.log('Todo deleted successfully', { todoId: id });
    console.log('Todo deleted successfully', { 
      todoId: id, 
      userId 
    });

  } catch (error) {
    console.error('Error in deleteTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }

    return createInternalServerErrorResponse('Failed to delete todo');
  }
};