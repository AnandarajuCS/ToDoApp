#!/bin/bash

# Cleanup script for Todo application
set -e

echo "🧹 Todo Application Cleanup Script"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will permanently delete all AWS resources created by this application!"
echo "This includes:"
echo "  - DynamoDB table and ALL todo data"
echo "  - Lambda functions"
echo "  - API Gateway"
echo "  - S3 bucket and website files"
echo "  - CloudFront distribution"
echo "  - CloudWatch logs and alarms"
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Cannot proceed with cleanup."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
fi

echo "AWS Account: $AWS_ACCOUNT"
echo "AWS Region: $AWS_REGION"
echo ""

# Confirmation prompt
read -p "Are you sure you want to delete ALL resources? Type 'DELETE' to confirm: " confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🗑️  Starting cleanup process..."

cd "$PROJECT_ROOT/infrastructure"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name TodoInfrastructureStack --region $AWS_REGION &> /dev/null; then
    echo "📋 Found TodoInfrastructureStack, proceeding with deletion..."
    
    # Optional: Backup DynamoDB data before deletion
    read -p "Do you want to backup DynamoDB data before deletion? (y/N): " backup_choice
    
    if [[ $backup_choice =~ ^[Yy]$ ]]; then
        echo "💾 Creating DynamoDB backup..."
        
        # Create backup directory
        BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Export DynamoDB data
        aws dynamodb scan \
            --table-name TodoItems \
            --region $AWS_REGION \
            --output json > "$BACKUP_DIR/todos_backup.json" 2>/dev/null || echo "⚠️  Could not backup DynamoDB data (table may not exist)"
        
        echo "✅ Backup saved to: $BACKUP_DIR/todos_backup.json"
    fi
    
    # Destroy the CDK stack
    echo "🗑️  Destroying CDK stack..."
    cdk destroy --force
    
    echo "✅ Stack deletion initiated."
    
    # Wait for stack deletion to complete
    echo "⏳ Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete \
        --stack-name TodoInfrastructureStack \
        --region $AWS_REGION
    
    echo "✅ Stack deleted successfully!"
    
else
    echo "ℹ️  TodoInfrastructureStack not found. Nothing to delete."
fi

# Clean up local build artifacts
echo "🧹 Cleaning up local build artifacts..."

cd "$PROJECT_ROOT"

# Remove build directories
rm -rf backend/dist
rm -rf frontend/build
rm -rf infrastructure/cdk.out
rm -f backend/function.zip

# Remove node_modules if requested
read -p "Do you want to remove node_modules directories? (y/N): " clean_modules

if [[ $clean_modules =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing node_modules..."
    rm -rf node_modules
    rm -rf backend/node_modules
    rm -rf frontend/node_modules
    rm -rf infrastructure/node_modules
    echo "✅ node_modules removed."
fi

# Remove environment files
rm -f frontend/.env.production
rm -f .env

echo ""
echo "🎉 Cleanup completed successfully!"
echo ""
echo "📋 What was cleaned up:"
echo "  ✅ AWS CloudFormation stack deleted"
echo "  ✅ All AWS resources removed"
echo "  ✅ Local build artifacts removed"
if [[ $clean_modules =~ ^[Yy]$ ]]; then
    echo "  ✅ node_modules directories removed"
fi
if [[ $backup_choice =~ ^[Yy]$ ]]; then
    echo "  💾 DynamoDB data backed up to: $BACKUP_DIR"
fi
echo ""
echo "💡 To redeploy the application, run:"
echo "   ./scripts/deploy.sh"