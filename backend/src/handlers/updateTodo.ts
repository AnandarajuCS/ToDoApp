import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { UpdateTodoRequest, TodoValidationException } from '../types/TodoItem';
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
  console.log('UpdateTodo Lambda invoked', {
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

    if (!event.body) {
      return createBadRequestResponse('Request body is required');
    }

    let request: UpdateTodoRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      return createBadRequestResponse('Invalid JSON in request body');
    }

    const updatedTodo = await todoService.updateTodo(userId, id, request);
    
    if (!updatedTodo) {
      // Todo not found or access denied
      console.log('Todo not found or access denied for update', { 
        todoId: id, 
        userId 
      });
      return createNotFoundResponse('Todo not found');
    }

    console.log('Todo updated successfully', { 
      todoId: id, 
      userId 
    });
    return createSuccessResponse(updatedTodo);

  } catch (error) {
    console.error('Error in updateTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }

    return createInternalServerErrorResponse('Failed to update todo');
  }
};