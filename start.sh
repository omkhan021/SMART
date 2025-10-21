#!/bin/bash

echo "🚀 Starting Social Media Sentiment Analyzer"
echo "=========================================="

# Kill any existing processes on ports 3000 and 5000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No process on port 5000"

# Start the server
echo "🖥️  Starting backend server..."
cd server
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:5000"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start the client
echo "🌐 Starting frontend client..."
cd ../client
npm run dev &
CLIENT_PID=$!

# Wait a moment for client to start
sleep 10

# Check if client is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend client is running on http://localhost:3000"
else
    echo "❌ Frontend client failed to start"
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Application is ready!"
echo "======================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo "✅ Servers stopped"; exit 0' INT

# Keep script running
wait
