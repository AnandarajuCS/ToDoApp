import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { UpdateTodoRequest, TodoValidationException } from '../types/TodoItem';
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
  console.log('UpdateTodo Lambda invoked', {
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

    if (!event.body) {
      return createBadRequestResponse('Request body is required');
    }

    let request: UpdateTodoRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      return createBadRequestResponse('Invalid JSON in request body');
    }

    const updatedTodo = await todoService.updateTodo(id, request);
    
    if (!updatedTodo) {
      console.log('Todo not found for update', { todoId: id });
      return createNotFoundResponse('Todo not found');
    }

    console.log('Todo updated successfully', { todoId: id });
    return createSuccessResponse(updatedTodo);

  } catch (error) {
    console.error('Error in updateTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }

    return createInternalServerErrorResponse('Failed to update todo');
  }
};