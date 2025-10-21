#!/bin/bash

# Setup script to create .env file from template
echo "🔧 Setting up environment configuration..."

# Check if .env already exists
if [ -f "server/.env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp server/.env server/.env.backup
fi

# Copy the example file to create .env
cp env.example server/.env

echo "✅ Created server/.env file from template"
echo ""
echo "📝 Please edit server/.env and add your actual API credentials:"
echo "   - TWITTER_API_KEY"
echo "   - TWITTER_API_SECRET"
echo "   - TWITTER_ACCESS_TOKEN"
echo "   - TWITTER_ACCESS_TOKEN_SECRET"
echo "   - TWITTER_BEARER_TOKEN"
echo ""
echo "🔒 The .env file is gitignored for security"
echo "🚀 After updating the credentials, restart the server"
