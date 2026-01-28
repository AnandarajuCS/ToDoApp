import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TodoService } from '../services/TodoService';
import { TodoValidationException } from '../types/TodoItem';
import {
  createNoContentResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createForbiddenResponse,
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
    const id = event.pathParameters?.id;
    // Extract userId from authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub || 
                   event.requestContext.authorizer?.principalId ||
                   'anonymous';
    
    console.log('DeleteTodo - User context', { userId, todoId: event.pathParameters?.id });

    if (!id) {
      return createBadRequestResponse('Todo ID is required');
    }

    const deleted = await todoService.deleteTodo(id);
    const deleted = await todoService.deleteTodo(id, userId);
    if (!deleted) {
      console.log('Todo not found for deletion', { todoId: id });
      return createNotFoundResponse('Todo not found');
    }

    console.log('Todo deleted successfully', { todoId: id });
    return createNoContentResponse();

  } catch (error) {
    console.error('Error in deleteTodo handler:', error);

    if (error instanceof TodoValidationException) {
      return createBadRequestResponse('Validation failed', error.errors);
    }


    if (error instanceof Error && error.message.startsWith('Forbidden:')) {
      console.log('Delete forbidden', { error: error.message });
      return createForbiddenResponse(error.message.replace('Forbidden: ', ''));
    }
    return createInternalServerErrorResponse('Failed to delete todo');
  }
};