# Deployment Guide

This guide provides detailed instructions for deploying the Todo application to AWS.

## Prerequisites

### Required Software
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **npm**: Comes with Node.js
- **AWS CLI**: Install from [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK**: Install globally with `npm install -g aws-cdk`

### AWS Account Setup
1. **AWS Account**: You need an active AWS account
2. **IAM User**: Create an IAM user with programmatic access
3. **Required Permissions**: The IAM user needs the following permissions:
   - CloudFormation (full access)
   - Lambda (full access)
   - DynamoDB (full access)
   - API Gateway (full access)
   - S3 (full access)
   - CloudFront (full access)
   - IAM (create/manage roles)
   - CloudWatch (logs and alarms)

### AWS CLI Configuration
```bash
aws configure
```
Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

Verify configuration:
```bash
aws sts get-caller-identity
```

## Deployment Methods

### Method 1: One-Command Deployment (Recommended)

```bash
./scripts/deploy.sh
```

This script will:
1. Check prerequisites
2. Install dependencies
3. Build all components
4. Bootstrap CDK (if needed)
5. Deploy infrastructure
6. Configure frontend with API URL
7. Redeploy with updated configuration
8. Output application URLs

### Method 2: Manual Step-by-Step Deployment

#### Step 1: Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd infrastructure && npm install && cd ..
```

#### Step 2: Build Components
```bash
# Build backend
cd backend
npm run build
cd ..

# Build frontend (initial build)
cd frontend
npm run build
cd ..

# Build infrastructure
cd infrastructure
npm run build
cd ..
```

#### Step 3: Bootstrap CDK
```bash
cd infrastructure
cdk bootstrap
```

#### Step 4: Deploy Infrastructure
```bash
cdk deploy --require-approval never
```

#### Step 5: Get API URL and Update Frontend
```bash
# Get API URL from CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

# Update frontend configuration
cd ../frontend
echo "REACT_APP_API_URL=$API_URL" > .env.production

# Rebuild frontend with API URL
npm run build
cd ../infrastructure

# Redeploy to update frontend
cdk deploy --require-approval never
```

## Deployment Verification

### Automated Testing
```bash
./scripts/test-deployment.sh
```

### Manual Verification

#### 1. Check CloudFormation Stack
```bash
aws cloudformation describe-stacks --stack-name TodoInfrastructureStack
```

#### 2. Test API Endpoints
```bash
# Get API URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

# Test health endpoint
curl $API_URL/health

# Test todos endpoint
curl $API_URL/todos
```

#### 3. Test Website
```bash
# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text)

# Open in browser or test with curl
curl $WEBSITE_URL
```

## Environment-Specific Deployments

### Development Environment
```bash
# Use a different stack name for dev
export CDK_STACK_NAME=TodoInfrastructureStack-Dev
./scripts/deploy.sh
```

### Production Environment
```bash
# Use production-optimized settings
export NODE_ENV=production
export CDK_STACK_NAME=TodoInfrastructureStack-Prod
./scripts/deploy.sh
```

## Configuration Options

### Environment Variables

Create a `.env` file in the project root:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# Application Configuration
NODE_ENV=production
TODO_TABLE_NAME=TodoItems

# Frontend Configuration (set automatically during deployment)
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

### CDK Context
Modify `infrastructure/cdk.json` for advanced configuration:
```json
{
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## Monitoring Setup

### CloudWatch Dashboards
The deployment automatically creates:
- Lambda function metrics
- API Gateway metrics
- DynamoDB metrics
- Error alarms

### Custom Alarms
Add custom alarms in `infrastructure/lib/todo-infrastructure-stack.ts`:
```typescript
new cloudwatch.Alarm(this, 'CustomAlarm', {
  metric: api.metricCount(),
  threshold: 1000,
  evaluationPeriods: 2,
});
```

## Security Configuration

### CORS Settings
CORS is configured to allow all origins by default. For production, update in `infrastructure/lib/todo-infrastructure-stack.ts`:
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: ['https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
},
```

### IAM Roles
The deployment creates least-privilege IAM roles. Review and customize in the infrastructure code if needed.

### DynamoDB Security
- Encryption at rest is enabled by default
- Access is restricted to Lambda functions only
- No public access configured

## Troubleshooting Deployment Issues

### Common Problems

#### 1. CDK Bootstrap Required
```
Error: Need to perform AWS CDK bootstrap
```
**Solution:**
```bash
cd infrastructure
cdk bootstrap
```

#### 2. Insufficient Permissions
```
Error: User is not authorized to perform: cloudformation:CreateStack
```
**Solution:** Ensure your IAM user has the required permissions listed above.

#### 3. Region Mismatch
```
Error: Stack is in a different region
```
**Solution:** Ensure AWS CLI region matches your intended deployment region.

#### 4. Resource Limits
```
Error: Cannot exceed quota for resource type
```
**Solution:** Check AWS service quotas and request increases if needed.

#### 5. Build Failures
```
Error: Command failed: npm run build
```
**Solution:**
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debugging Steps

#### 1. Check AWS Credentials
```bash
aws sts get-caller-identity
aws configure list
```

#### 2. Verify CDK Installation
```bash
cdk --version
cdk doctor
```

#### 3. Check CloudFormation Events
```bash
aws cloudformation describe-stack-events --stack-name TodoInfrastructureStack
```

#### 4. Review CloudWatch Logs
```bash
aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/TodoInfrastructureStack'
```

## Rollback Procedures

### Rollback to Previous Version
```bash
# If deployment fails, CDK will automatically rollback
# To manually rollback:
cd infrastructure
cdk deploy --rollback
```

### Complete Rollback (Delete Stack)
```bash
./scripts/cleanup.sh
```

## Performance Optimization

### Lambda Configuration
- Memory: 128MB (default, increase if needed)
- Timeout: 30 seconds
- Runtime: Node.js 18.x

### DynamoDB Configuration
- Billing Mode: On-demand (scales automatically)
- Encryption: AWS managed keys
- Point-in-time recovery: Enabled

### CloudFront Configuration
- Global edge locations
- HTTPS redirect enabled
- Compression enabled
- Default TTL: 86400 seconds (1 day)

## Cost Estimation

### AWS Free Tier Coverage
- Lambda: 1M requests/month
- DynamoDB: 25GB storage + 25 RCU/WCU
- API Gateway: 1M requests/month
- S3: 5GB storage
- CloudFront: 50GB data transfer

### Estimated Monthly Costs (Beyond Free Tier)
- Lambda: ~$0.20 per 1M requests
- DynamoDB: ~$1.25 per million requests
- API Gateway: ~$3.50 per million requests
- S3: ~$0.023 per GB
- CloudFront: ~$0.085 per GB

## Maintenance

### Regular Tasks
1. **Monitor CloudWatch alarms**
2. **Review CloudWatch logs for errors**
3. **Update dependencies monthly**
4. **Backup DynamoDB data** (use `./scripts/backup.sh`)
5. **Review AWS costs**

### Updates
```bash
# Update application
git pull
./scripts/deploy.sh

# Update dependencies
npm update
cd frontend && npm update && cd ..
cd backend && npm update && cd ..
cd infrastructure && npm update && cd ..
```

### Scaling Considerations
- DynamoDB auto-scales with on-demand billing
- Lambda auto-scales up to account limits
- CloudFront provides global scaling
- Consider API Gateway throttling for high traffic

## Support and Resources

### AWS Documentation
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)

### Monitoring Tools
- AWS CloudWatch Console
- AWS X-Ray (for tracing)
- AWS Cost Explorer (for cost analysis)

### Getting Help
1. Check CloudWatch logs first
2. Review this troubleshooting guide
3. Consult AWS documentation
4. Create support ticket if needed