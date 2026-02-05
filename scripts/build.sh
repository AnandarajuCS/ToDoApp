#!/bin/bash

# Build script for Todo application
set -e

echo "🏗️  Building Todo Application..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install infrastructure dependencies
echo "📦 Installing infrastructure dependencies..."
cd infrastructure
npm install
cd ..

echo "🔨 Building backend..."
cd backend
npm run build
cd ..

echo "🔨 Building frontend..."
cd frontend
GENERATE_SOURCEMAP=false npm run build
cd ..

echo "🔨 Building infrastructure..."
cd infrastructure
npm run build
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run './scripts/deploy.sh' to deploy to AWS"
echo "2. Or run individual components:"
echo "   - Backend: cd backend && npm run build"
echo "   - Frontend: cd frontend && npm run build"
echo "   - Infrastructure: cd infrastructure && npm run build"