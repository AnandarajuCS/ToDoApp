#!/bin/bash

# Test deployment script for Todo application
set -e

echo "🧪 Testing Todo Application Deployment"
echo "======================================"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Cannot proceed with testing."
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

echo "🔍 Testing deployment in region: $AWS_REGION"

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name TodoInfrastructureStack --region $AWS_REGION &> /dev/null; then
    echo "❌ TodoInfrastructureStack not found. Please deploy first:"
    echo "   ./scripts/deploy.sh"
    exit 1
fi

# Get stack outputs
echo "📋 Getting stack outputs..."
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

echo "✅ API URL: $API_URL"
echo "✅ Website URL: $WEBSITE_URL"

# Test API endpoints
echo ""
echo "🔍 Testing API endpoints..."

# Test health check
echo "Testing health check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_URL/health" || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed"
    cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    cat /tmp/health_response.json 2>/dev/null || echo "No response body"
fi

echo ""

# Test GET /todos (should return empty array initially)
echo "Testing GET /todos..."
TODOS_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/todos_response.json "$API_URL/todos" || echo "000")
if [ "$TODOS_RESPONSE" = "200" ]; then
    echo "✅ GET /todos passed"
    TODOS_COUNT=$(cat /tmp/todos_response.json | jq 'length' 2>/dev/null || echo "unknown")
    echo "   Found $TODOS_COUNT todos"
else
    echo "❌ GET /todos failed (HTTP $TODOS_RESPONSE)"
    cat /tmp/todos_response.json 2>/dev/null || echo "No response body"
fi

echo ""

# Test POST /todos
echo "Testing POST /todos..."
TEST_TODO='{"title":"Test todo from deployment script"}'
CREATE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/create_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$TEST_TODO" \
    "$API_URL/todos" || echo "000")

if [ "$CREATE_RESPONSE" = "201" ]; then
    echo "✅ POST /todos passed"
    TODO_ID=$(cat /tmp/create_response.json | jq -r '.id' 2>/dev/null || echo "")
    echo "   Created todo with ID: $TODO_ID"
    
    if [ ! -z "$TODO_ID" ] && [ "$TODO_ID" != "null" ]; then
        # Test GET /todos/{id}
        echo ""
        echo "Testing GET /todos/$TODO_ID..."
        GET_TODO_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/get_todo_response.json "$API_URL/todos/$TODO_ID" || echo "000")
        if [ "$GET_TODO_RESPONSE" = "200" ]; then
            echo "✅ GET /todos/{id} passed"
        else
            echo "❌ GET /todos/{id} failed (HTTP $GET_TODO_RESPONSE)"
        fi
        
        # Test PUT /todos/{id}
        echo ""
        echo "Testing PUT /todos/$TODO_ID..."
        UPDATE_TODO='{"completed":true}'
        UPDATE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/update_response.json \
            -X PUT \
            -H "Content-Type: application/json" \
            -d "$UPDATE_TODO" \
            "$API_URL/todos/$TODO_ID" || echo "000")
        
        if [ "$UPDATE_RESPONSE" = "200" ]; then
            echo "✅ PUT /todos/{id} passed"
        else
            echo "❌ PUT /todos/{id} failed (HTTP $UPDATE_RESPONSE)"
        fi
        
        # Test DELETE /todos/{id}
        echo ""
        echo "Testing DELETE /todos/$TODO_ID..."
        DELETE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/delete_response.json \
            -X DELETE \
            "$API_URL/todos/$TODO_ID" || echo "000")
        
        if [ "$DELETE_RESPONSE" = "204" ]; then
            echo "✅ DELETE /todos/{id} passed"
        else
            echo "❌ DELETE /todos/{id} failed (HTTP $DELETE_RESPONSE)"
        fi
    fi
else
    echo "❌ POST /todos failed (HTTP $CREATE_RESPONSE)"
    cat /tmp/create_response.json 2>/dev/null || echo "No response body"
fi

# Test website accessibility
echo ""
echo "🌐 Testing website accessibility..."
WEBSITE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/website_response.html "$WEBSITE_URL" || echo "000")
if [ "$WEBSITE_RESPONSE" = "200" ]; then
    echo "✅ Website is accessible"
    
    # Check if it's actually the React app
    if grep -q "Todo App" /tmp/website_response.html; then
        echo "✅ Website contains expected content"
    else
        echo "⚠️  Website accessible but may not be the correct content"
    fi
else
    echo "❌ Website not accessible (HTTP $WEBSITE_RESPONSE)"
fi

# Test HTTPS
echo ""
echo "🔒 Testing HTTPS configuration..."
if [[ $WEBSITE_URL == https://* ]]; then
    echo "✅ Website uses HTTPS"
else
    echo "❌ Website does not use HTTPS"
fi

# Clean up temp files
rm -f /tmp/health_response.json /tmp/todos_response.json /tmp/create_response.json \
      /tmp/get_todo_response.json /tmp/update_response.json /tmp/delete_response.json \
      /tmp/website_response.html

echo ""
echo "🎉 Deployment testing completed!"
echo ""
echo "📋 Test Summary:"
echo "   API URL: $API_URL"
echo "   Website URL: $WEBSITE_URL"
echo ""
echo "💡 If any tests failed, check the CloudWatch logs for more details:"
echo "   aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/TodoInfrastructureStack' --region $AWS_REGION"