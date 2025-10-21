#!/bin/bash

# Social Media Sentiment Analyzer - Quick Start Script

echo "🚀 Social Media Sentiment Analyzer - Quick Start"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env from template"
    echo "⚠️  Please edit server/.env and add your API keys"
else
    echo "✅ server/.env already exists"
fi

if [ ! -f "client/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > client/.env.local
    echo "✅ Created client/.env.local"
else
    echo "✅ client/.env.local already exists"
fi

echo ""
echo "🔧 Installation Instructions:"
echo "1. Install root dependencies: npm install"
echo "2. Install server dependencies: cd server && npm install"
echo "3. Install client dependencies: cd client && npm install"
echo ""
echo "🚀 Running Instructions:"
echo "1. Start both services: npm run dev"
echo "2. Or start individually:"
echo "   - Backend: npm run server:dev"
echo "   - Frontend: npm run client:dev"
echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo ""
echo "📋 Required API Keys (add to server/.env):"
echo "- OPENAI_API_KEY (required for sentiment analysis)"
echo "- AGIFY_API_KEY (optional, for age prediction)"
echo "- GENDERIZE_API_KEY (optional, for gender prediction)"
echo "- HIVE_API_KEY (optional, for visual demographic analysis)"
echo ""
echo "✨ Features:"
echo "- Multi-platform social media analysis"
echo "- Real-time sentiment analysis with OpenAI GPT-4"
echo "- Demographic inference from usernames"
echo "- Interactive dashboard with visualizations"
echo "- Export capabilities (CSV, Excel, JSON, PDF)"
echo "- Dark mode support"
echo "- Responsive design"
echo ""
echo "📚 Documentation: See README.md for detailed instructions"
