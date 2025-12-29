#!/bin/bash

# Deployment script for Todo application
set -e

echo "🚀 Deploying Todo Application to AWS..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Installing it now..."
    npm install -g aws-cdk
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
    echo "⚠️  No default region set, using us-east-1"
fi

echo "✅ AWS Account: $AWS_ACCOUNT"
echo "✅ AWS Region: $AWS_REGION"

# Build the application
echo "🏗️  Building application..."
./scripts/build.sh

# Bootstrap CDK if needed
echo "🔧 Bootstrapping CDK (if needed)..."
cd infrastructure
cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION

# Deploy infrastructure
echo "🚀 Deploying infrastructure..."
cdk deploy --require-approval never

# Get the API URL from CDK outputs
echo "📋 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

# Update frontend with API URL
echo "🔧 Updating frontend configuration..."
cd ../frontend

# Create environment file for the frontend
cat > .env.production << EOF
REACT_APP_API_URL=$API_URL
EOF

# Rebuild frontend with correct API URL
echo "🔨 Rebuilding frontend with API configuration..."
npm run build

# Redeploy frontend with updated configuration
echo "📤 Redeploying frontend..."
cd ../infrastructure
cdk deploy --require-approval never

cd ..

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Application Details:"
echo "   API URL: $API_URL"
echo "   Website URL: $WEBSITE_URL"
echo ""
echo "🔗 You can now access your Todo application at:"
echo "   $WEBSITE_URL"
echo ""
echo "🧪 Test your API endpoints:"
echo "   curl $API_URL/todos"
echo ""
echo "📝 To clean up resources later, run:"
echo "   ./scripts/cleanup.sh"