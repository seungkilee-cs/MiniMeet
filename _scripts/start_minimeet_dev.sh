#!/usr/bin/env bash

# start_minimeet_dev.sh - Start MiniMeet development environment
echo "🚀 Starting MiniMeet development environment..."

# Start all Docker containers (MySQL, MongoDB, Redis, Elasticsearch)
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to initialize..."
sleep 8

# Verify containers are running
echo "✅ Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}"

# Start NestJS backend in development mode
echo "🏗️  Starting NestJS backend server..."
echo "   Server will start on http://localhost:3001"
echo "   Press Ctrl+C to stop the server"
echo ""

cd minimeet-server && npm run start:dev
