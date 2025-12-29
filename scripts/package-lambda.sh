#!/bin/bash

# Package Lambda functions for deployment
set -e

echo "📦 Packaging Lambda functions..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/backend"

# Ensure dist directory exists and is built
if [ ! -d "dist" ]; then
    echo "🔨 Building backend first..."
    npm run build
fi

# Create deployment package
echo "📦 Creating deployment package..."
rm -f function.zip

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
cp -r dist/* "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"

# Install production dependencies in temp directory
cd "$TEMP_DIR"
npm install --production --no-optional

# Create zip file
zip -r "$PROJECT_ROOT/backend/function.zip" . -x "*.DS_Store*" "*.git*"

# Clean up
cd "$PROJECT_ROOT/backend"
rm -rf "$TEMP_DIR"

echo "✅ Lambda package created: backend/function.zip"
echo "📊 Package size: $(du -h function.zip | cut -f1)"