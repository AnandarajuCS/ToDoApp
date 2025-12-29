# Production-Ready Todo Application

A modern, serverless todo list application built with React, AWS Lambda, DynamoDB, and deployed using AWS CDK. This application demonstrates production-ready practices including proper error handling, monitoring, security, and automated deployment.

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   User      │───▶│  CloudFront  │───▶│     S3      │    │              │
└─────────────┘    └──────────────┘    └─────────────┘    │              │
                                                          │   DynamoDB   │
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    │              │
│   User      │───▶│ API Gateway  │───▶│   Lambda    │───▶│              │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Components

- **Frontend**: React SPA with TypeScript, responsive design
- **Backend**: AWS Lambda functions with Node.js/TypeScript
- **Database**: DynamoDB with on-demand billing
- **API**: REST API via AWS API Gateway with CORS
- **Hosting**: S3 + CloudFront for global CDN
- **Infrastructure**: AWS CDK for Infrastructure as Code
- **Monitoring**: CloudWatch logs, alarms, and metrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

### One-Command Deployment

```bash
git clone <repository-url>
cd ToDoApp
./scripts/deploy.sh
```

This will:
1. Install all dependencies
2. Build the application
3. Deploy infrastructure to AWS
4. Output the application URL

## 📋 Detailed Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd ToDoApp
npm install
```

### 2. Configure AWS

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and preferred region
```

### 3. Build Application

```bash
./scripts/build.sh
```

### 4. Deploy to AWS

```bash
./scripts/deploy.sh
```

### 5. Test Deployment

```bash
./scripts/test-deployment.sh
```

## 🛠️ Development

### Local Development

```bash
# Start frontend development server
./scripts/dev.sh

# Or manually:
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`.

**Note**: For full functionality, you'll need to deploy the backend to AWS as Lambda functions cannot run locally without additional setup.

### Project Structure

```
ToDoApp/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API service layer
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── backend/            # Lambda functions
│   └── src/
│       ├── handlers/   # Lambda function handlers
│       ├── services/   # Business logic
│       ├── types/      # TypeScript interfaces
│       └── utils/      # Utility functions
├── infrastructure/     # AWS CDK code
│   └── lib/           # CDK stack definitions
└── scripts/           # Deployment and utility scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key configuration:
- `REACT_APP_API_URL`: API Gateway URL (set automatically during deployment)
- `AWS_REGION`: AWS region for deployment
- `TODO_TABLE_NAME`: DynamoDB table name

### AWS Resources Created

The deployment creates:
- **DynamoDB Table**: `TodoItems` with on-demand billing
- **Lambda Functions**: 6 functions for API endpoints + health check
- **API Gateway**: REST API with CORS enabled
- **S3 Bucket**: Frontend hosting with public read access
- **CloudFront Distribution**: Global CDN with HTTPS
- **IAM Roles**: Least-privilege access for Lambda functions
- **CloudWatch**: Logs, alarms, and monitoring

## 📊 API Documentation

### Base URL
After deployment, your API will be available at: `https://<api-id>.execute-api.<region>.amazonaws.com/prod`

### Endpoints

#### Health Check
```
GET /health
```
Returns service health status.

#### Todos
```
GET /todos
```
Returns all todo items.

```
POST /todos
Content-Type: application/json

{
  "title": "Todo item title"
}
```
Creates a new todo item.

```
GET /todos/{id}
```
Returns a specific todo item.

```
PUT /todos/{id}
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```
Updates a todo item (partial updates supported).

```
DELETE /todos/{id}
```
Deletes a todo item.

### Response Format

#### Success Response
```json
{
  "id": "uuid-v4",
  "title": "Todo title",
  "completed": false,
  "createdAt": "2023-12-01T10:00:00.000Z",
  "updatedAt": "2023-12-01T10:00:00.000Z"
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": {
    "field": "validation error details"
  }
}
```

## 🔒 Security Features

- **HTTPS Only**: All traffic encrypted in transit
- **CORS**: Properly configured for frontend domain
- **Input Validation**: Server-side validation for all inputs
- **IAM Roles**: Least-privilege access for AWS resources
- **Encryption**: DynamoDB encryption at rest
- **Error Handling**: No sensitive information leaked in errors

## 📈 Monitoring & Logging

### CloudWatch Integration
- **Lambda Logs**: All function executions logged
- **API Gateway Logs**: Request/response logging enabled
- **Alarms**: Automated alerts for errors and latency
- **Metrics**: Performance and usage metrics

### Health Monitoring
```bash
# Check API health
curl https://your-api-url/health

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/TodoInfrastructureStack'
```

## 🧪 Testing

### Automated Testing
```bash
# Test deployment
./scripts/test-deployment.sh

# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

### Manual Testing
1. Visit the deployed website URL
2. Create, update, and delete todos
3. Test responsive design on mobile devices
4. Verify error handling with invalid inputs

## 🗑️ Cleanup

### Remove All Resources
```bash
./scripts/cleanup.sh
```

This will:
1. Optionally backup your data
2. Delete all AWS resources
3. Clean up local build artifacts
4. Provide confirmation prompts for safety

### Backup Data
```bash
# Create backup before cleanup
./scripts/backup.sh

# Restore from backup (after redeployment)
./scripts/restore.sh <backup_timestamp>
```

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Ensure CDK is bootstrapped
cd infrastructure && cdk bootstrap
```

#### API Returns 500 Errors
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/TodoInfrastructureStack'
aws logs get-log-events --log-group-name '/aws/lambda/TodoInfrastructureStack-CreateTodoFunction'
```

#### Frontend Shows API Errors
1. Verify API URL in browser network tab
2. Check CORS configuration
3. Ensure API Gateway is deployed correctly

#### DynamoDB Access Denied
- Verify IAM roles have correct permissions
- Check if table exists in correct region

### Getting Help

1. **Check CloudWatch Logs**: Most issues are logged there
2. **Verify AWS Resources**: Use AWS Console to check resource status
3. **Test API Endpoints**: Use curl or Postman to test API directly
4. **Check Network**: Ensure no firewall/proxy issues

## 📝 Development Notes

### Adding New Features
1. Update the data model in `backend/src/types/`
2. Add/modify Lambda handlers in `backend/src/handlers/`
3. Update frontend components in `frontend/src/components/`
4. Add infrastructure changes in `infrastructure/lib/`
5. Deploy with `./scripts/deploy.sh`

### Performance Considerations
- DynamoDB uses on-demand billing (scales automatically)
- CloudFront provides global caching
- Lambda functions have 30-second timeout
- API Gateway has built-in throttling

### Cost Optimization
- On-demand DynamoDB billing (pay per request)
- Lambda free tier covers most development usage
- S3 and CloudFront have generous free tiers
- Consider reserved capacity for high-traffic production use

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Create an issue in the repository
4. Include deployment logs and error messages