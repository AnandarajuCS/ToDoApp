# API Documentation

This document provides comprehensive documentation for the Todo Application REST API.

## Base URL

After deployment, your API will be available at:
```
https://<api-id>.execute-api.<region>.amazonaws.com/prod
```

You can find your specific API URL in the CloudFormation stack outputs or by running:
```bash
aws cloudformation describe-stacks --stack-name TodoInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Type

All requests that include a body must use:
```
Content-Type: application/json
```

## CORS

The API is configured with CORS to allow requests from any origin with the following headers:
- `Content-Type`
- `X-Amz-Date`
- `Authorization`
- `X-Api-Key`
- `X-Amz-Security-Token`

## Rate Limiting

API Gateway provides built-in throttling. Default limits:
- 10,000 requests per second
- 5,000 concurrent requests

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Resource deleted successfully |
| 400 | Bad Request - Invalid request data |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "details": {
    "field": "Specific validation error details"
  }
}
```

## Endpoints

### Health Check

Check the health status of the API service.

#### Request
```http
GET /health
```

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "service": "todo-api",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

#### Error Response
```json
{
  "status": "unhealthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "service": "todo-api",
  "version": "1.0.0",
  "checks": {
    "database": "unhealthy",
    "api": "healthy"
  },
  "error": "Database connection failed"
}
```

---

### Get All Todos

Retrieve all todo items, sorted by creation date (newest first).

#### Request
```http
GET /todos
```

#### Response
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Complete project documentation",
    "completed": false,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "title": "Review pull requests",
    "completed": true,
    "createdAt": "2023-12-01T09:30:00.000Z",
    "updatedAt": "2023-12-01T11:15:00.000Z"
  }
]
```

#### Empty Response
```json
[]
```

---

### Create Todo

Create a new todo item.

#### Request
```http
POST /todos
Content-Type: application/json

{
  "title": "New todo item"
}
```

#### Request Body Schema
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| title | string | Yes | Todo item title | 1-500 characters, cannot be empty or whitespace only |

#### Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "title": "New todo item",
  "completed": false,
  "createdAt": "2023-12-01T12:00:00.000Z",
  "updatedAt": "2023-12-01T12:00:00.000Z"
}
```

#### Validation Errors (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

### Get Single Todo

Retrieve a specific todo item by ID.

#### Request
```http
GET /todos/{id}
```

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | UUID of the todo item |

#### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Complete project documentation",
  "completed": false,
  "createdAt": "2023-12-01T10:00:00.000Z",
  "updatedAt": "2023-12-01T10:00:00.000Z"
}
```

#### Not Found (404 Not Found)
```json
{
  "error": "Todo not found"
}
```

---

### Update Todo

Update an existing todo item. Supports partial updates.

#### Request
```http
PUT /todos/{id}
Content-Type: application/json

{
  "title": "Updated todo title",
  "completed": true
}
```

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | UUID of the todo item |

#### Request Body Schema
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| title | string | No | Updated todo title | 1-500 characters, cannot be empty or whitespace only |
| completed | boolean | No | Completion status | true or false |

#### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated todo title",
  "completed": true,
  "createdAt": "2023-12-01T10:00:00.000Z",
  "updatedAt": "2023-12-01T12:30:00.000Z"
}
```

#### Not Found (404 Not Found)
```json
{
  "error": "Todo not found"
}
```

#### Validation Errors (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title cannot be empty or whitespace only"
    }
  ]
}
```

---

### Delete Todo

Delete a todo item.

#### Request
```http
DELETE /todos/{id}
```

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | UUID of the todo item |

#### Response (204 No Content)
No response body.

#### Not Found (404 Not Found)
```json
{
  "error": "Todo not found"
}
```

## Data Models

### Todo Item

| Field | Type | Description | Format |
|-------|------|-------------|---------|
| id | string | Unique identifier | UUID v4 |
| title | string | Todo item title | 1-500 characters |
| completed | boolean | Completion status | true/false |
| createdAt | string | Creation timestamp | ISO 8601 (UTC) |
| updatedAt | string | Last update timestamp | ISO 8601 (UTC) |

### Example Todo Item
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Complete project documentation",
  "completed": false,
  "createdAt": "2023-12-01T10:00:00.000Z",
  "updatedAt": "2023-12-01T10:00:00.000Z"
}
```

## Usage Examples

### cURL Examples

#### Create a todo
```bash
curl -X POST https://your-api-url/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn AWS CDK"}'
```

#### Get all todos
```bash
curl https://your-api-url/todos
```

#### Update a todo
```bash
curl -X PUT https://your-api-url/todos/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

#### Delete a todo
```bash
curl -X DELETE https://your-api-url/todos/123e4567-e89b-12d3-a456-426614174000
```

### JavaScript/Fetch Examples

#### Create a todo
```javascript
const response = await fetch('https://your-api-url/todos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Learn AWS CDK'
  })
});

const todo = await response.json();
console.log(todo);
```

#### Get all todos
```javascript
const response = await fetch('https://your-api-url/todos');
const todos = await response.json();
console.log(todos);
```

#### Update a todo
```javascript
const response = await fetch(`https://your-api-url/todos/${todoId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    completed: true
  })
});

const updatedTodo = await response.json();
console.log(updatedTodo);
```

### Python/Requests Examples

#### Create a todo
```python
import requests

response = requests.post('https://your-api-url/todos', 
  json={'title': 'Learn AWS CDK'})

if response.status_code == 201:
    todo = response.json()
    print(todo)
```

#### Get all todos
```python
response = requests.get('https://your-api-url/todos')
todos = response.json()
print(todos)
```

## Testing the API

### Automated Testing Script
```bash
./scripts/test-deployment.sh
```

### Manual Testing with Postman

1. Import the following collection:
```json
{
  "info": {
    "name": "Todo API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-api-url"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Get All Todos",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/todos"
      }
    },
    {
      "name": "Create Todo",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/todos",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"title\":\"Test todo from Postman\"}"
        }
      }
    }
  ]
}
```

## Monitoring and Logging

### CloudWatch Logs
All API requests are logged to CloudWatch. Log groups:
- `/aws/lambda/TodoInfrastructureStack-CreateTodoFunction`
- `/aws/lambda/TodoInfrastructureStack-GetTodosFunction`
- `/aws/lambda/TodoInfrastructureStack-GetTodoFunction`
- `/aws/lambda/TodoInfrastructureStack-UpdateTodoFunction`
- `/aws/lambda/TodoInfrastructureStack-DeleteTodoFunction`
- `/aws/lambda/TodoInfrastructureStack-HealthCheckFunction`

### Metrics
Available CloudWatch metrics:
- Request count
- Error count
- Latency (p50, p90, p99)
- Throttles

### Alarms
Automatic alarms are configured for:
- API Gateway 5xx errors (threshold: 10 in 5 minutes)
- API Gateway latency (threshold: 2 seconds)
- Lambda function errors (threshold: 5 in 5 minutes)

## Performance Characteristics

### Latency
- Typical response time: 50-200ms
- Cold start latency: 500-1000ms (first request after idle)
- DynamoDB latency: Single-digit milliseconds

### Throughput
- API Gateway: 10,000 requests/second (default)
- Lambda: 1,000 concurrent executions (default)
- DynamoDB: On-demand scaling (no limits)

### Limits
- Request payload: 10MB maximum
- Response payload: 10MB maximum
- Lambda timeout: 30 seconds
- API Gateway timeout: 30 seconds

## Security Considerations

### Input Validation
- All inputs are validated server-side
- SQL injection protection (NoSQL database)
- XSS protection through proper encoding

### Data Protection
- HTTPS enforced for all requests
- DynamoDB encryption at rest
- No sensitive data in logs

### Access Control
- Currently no authentication required
- CORS configured for web access
- IAM roles with least privilege

## Changelog

### Version 1.0.0
- Initial API release
- Basic CRUD operations for todos
- Health check endpoint
- CloudWatch integration
- Error handling and validation