#!/bin/bash

# Backup script for Todo application data
set -e

echo "💾 Todo Application Backup Script"
echo "================================="

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Cannot proceed with backup."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
fi

# Create backup directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in: $BACKUP_DIR"

# Backup DynamoDB data
echo "💾 Backing up DynamoDB data..."
if aws dynamodb describe-table --table-name TodoItems --region $AWS_REGION &> /dev/null; then
    aws dynamodb scan \
        --table-name TodoItems \
        --region $AWS_REGION \
        --output json > "$BACKUP_DIR/todos_data.json"
    
    # Also create a human-readable version
    aws dynamodb scan \
        --table-name TodoItems \
        --region $AWS_REGION \
        --output table > "$BACKUP_DIR/todos_readable.txt"
    
    echo "✅ DynamoDB data backed up"
else
    echo "⚠️  TodoItems table not found, skipping DynamoDB backup"
fi

# Backup CloudFormation template
echo "📋 Backing up CloudFormation template..."
if aws cloudformation describe-stacks --stack-name TodoInfrastructureStack --region $AWS_REGION &> /dev/null; then
    aws cloudformation get-template \
        --stack-name TodoInfrastructureStack \
        --region $AWS_REGION \
        --output json > "$BACKUP_DIR/cloudformation_template.json"
    
    # Backup stack parameters and outputs
    aws cloudformation describe-stacks \
        --stack-name TodoInfrastructureStack \
        --region $AWS_REGION \
        --output json > "$BACKUP_DIR/stack_details.json"
    
    echo "✅ CloudFormation template backed up"
else
    echo "⚠️  TodoInfrastructureStack not found, skipping CloudFormation backup"
fi

# Create backup metadata
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Todo Application Backup
======================
Backup Date: $(date)
AWS Region: $AWS_REGION
AWS Account: $(aws sts get-caller-identity --query Account --output text)

Files in this backup:
- todos_data.json: DynamoDB table data (JSON format)
- todos_readable.txt: DynamoDB table data (human-readable)
- cloudformation_template.json: Infrastructure template
- stack_details.json: Stack parameters and outputs
- backup_info.txt: This file

To restore data:
1. Deploy the application: ./scripts/deploy.sh
2. Use the restore script: ./scripts/restore.sh $TIMESTAMP
EOF

echo ""
echo "🎉 Backup completed successfully!"
echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo "📊 Backup contents:"
ls -la "$BACKUP_DIR"
echo ""
echo "💡 To restore this backup later, run:"
echo "   ./scripts/restore.sh $TIMESTAMP"