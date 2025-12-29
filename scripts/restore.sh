#!/bin/bash

# Restore script for Todo application data
set -e

echo "🔄 Todo Application Restore Script"
echo "=================================="

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if backup timestamp is provided
if [ -z "$1" ]; then
    echo "❌ Please provide a backup timestamp."
    echo ""
    echo "Usage: $0 <backup_timestamp>"
    echo ""
    echo "Available backups:"
    if [ -d "$PROJECT_ROOT/backups" ]; then
        ls -1 "$PROJECT_ROOT/backups" | grep -E '^[0-9]{8}_[0-9]{6}$' || echo "  No backups found"
    else
        echo "  No backups directory found"
    fi
    exit 1
fi

BACKUP_TIMESTAMP="$1"
BACKUP_DIR="$PROJECT_ROOT/backups/$BACKUP_TIMESTAMP"

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup not found: $BACKUP_DIR"
    exit 1
fi

echo "📁 Restoring from backup: $BACKUP_DIR"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Cannot proceed with restore."
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

# Check if the application is deployed
if ! aws cloudformation describe-stacks --stack-name TodoInfrastructureStack --region $AWS_REGION &> /dev/null; then
    echo "❌ TodoInfrastructureStack not found. Please deploy the application first:"
    echo "   ./scripts/deploy.sh"
    exit 1
fi

# Check if DynamoDB table exists
if ! aws dynamodb describe-table --table-name TodoItems --region $AWS_REGION &> /dev/null; then
    echo "❌ TodoItems table not found. Please ensure the application is properly deployed."
    exit 1
fi

# Restore DynamoDB data
if [ -f "$BACKUP_DIR/todos_data.json" ]; then
    echo "🔄 Restoring DynamoDB data..."
    
    # First, clear existing data (optional)
    read -p "Do you want to clear existing todos before restoring? (y/N): " clear_existing
    
    if [[ $clear_existing =~ ^[Yy]$ ]]; then
        echo "🗑️  Clearing existing todos..."
        
        # Get all existing items
        EXISTING_ITEMS=$(aws dynamodb scan \
            --table-name TodoItems \
            --region $AWS_REGION \
            --projection-expression "id" \
            --output json)
        
        # Delete each item
        echo "$EXISTING_ITEMS" | jq -r '.Items[].id.S' | while read -r todo_id; do
            if [ ! -z "$todo_id" ]; then
                aws dynamodb delete-item \
                    --table-name TodoItems \
                    --key "{\"id\":{\"S\":\"$todo_id\"}}" \
                    --region $AWS_REGION > /dev/null
            fi
        done
        
        echo "✅ Existing todos cleared"
    fi
    
    # Restore backup data
    echo "📥 Importing backup data..."
    
    # Convert and import each item
    jq -r '.Items[] | @base64' "$BACKUP_DIR/todos_data.json" | while read -r item; do
        echo "$item" | base64 --decode | jq -c '.' | while read -r todo_item; do
            aws dynamodb put-item \
                --table-name TodoItems \
                --item "$todo_item" \
                --region $AWS_REGION > /dev/null
        done
    done
    
    echo "✅ DynamoDB data restored"
else
    echo "⚠️  No DynamoDB backup found in $BACKUP_DIR"
fi

# Verify restoration
echo "🔍 Verifying restoration..."
ITEM_COUNT=$(aws dynamodb scan \
    --table-name TodoItems \
    --region $AWS_REGION \
    --select COUNT \
    --output json | jq -r '.Count')

echo "📊 Restored $ITEM_COUNT todo items"

# Show backup info
if [ -f "$BACKUP_DIR/backup_info.txt" ]; then
    echo ""
    echo "📋 Backup Information:"
    cat "$BACKUP_DIR/backup_info.txt"
fi

echo ""
echo "🎉 Restore completed successfully!"
echo ""
echo "💡 You can now access your restored application at:"
WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name TodoInfrastructureStack \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)
echo "   $WEBSITE_URL"