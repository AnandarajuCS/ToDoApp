#!/bin/bash

# Development script for Todo application
set -e

echo "🛠️  Starting Todo Application in development mode..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start frontend development server
echo "🌐 Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Development servers started!"
echo ""
echo "📋 Development URLs:"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📝 Notes:"
echo "   - Frontend will auto-reload on changes"
echo "   - For backend development, you'll need to deploy to AWS or use local testing"
echo "   - Press Ctrl+C to stop all servers"
echo ""

# Wait for frontend process
wait $FRONTEND_PID