import { APIGatewayProxyResult } from 'aws-lambda';

export function createResponse(
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'none'; script-src 'none'; object-src 'none'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export function createSuccessResponse(data: any): APIGatewayProxyResult {
  return createResponse(200, data);
}

export function createCreatedResponse(data: any): APIGatewayProxyResult {
  return createResponse(201, data);
}

export function createNoContentResponse(): APIGatewayProxyResult {
  return createResponse(204, '');
}

export function createBadRequestResponse(message: string, errors?: any): APIGatewayProxyResult {
  return createResponse(400, { error: message, details: errors });
}

export function createNotFoundResponse(message: string = 'Resource not found'): APIGatewayProxyResult {
  return createResponse(404, { error: message });
}

export function createInternalServerErrorResponse(message: string = 'Internal server error'): APIGatewayProxyResult {
  return createResponse(500, { error: message });
}