#!/usr/bin/env bash
# stop_minimeet_dev.sh - Stop MiniMeet development environment

echo "🛑 Stopping MiniMeet development environment..."

# Stop NestJS backend server if running
NEST_PID=$(lsof -i :3001 -t 2>/dev/null)
if [ -n "$NEST_PID" ]; then
  echo "   Stopping NestJS server (PID $NEST_PID)..."
  kill -9 $NEST_PID
  echo "   ✅ NestJS server stopped"
else
  echo "   ℹ️  No NestJS server running on port 3001"
fi

# Stop all Docker containers
echo "📦 Stopping Docker containers..."
docker-compose down

echo "🧹 Development environment stopped successfully!"
echo ""
echo "💡 Tip: Run './start_minimeet_dev.sh' to restart development"
