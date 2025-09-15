#!/usr/bin/env bash
# cleanup_minimeet_dev.sh - Stop and clean up MiniMeet development environment

echo "🧹 Cleaning up MiniMeet development environment..."

# Stop NestJS server
NEST_PID=$(lsof -i :3001 -t 2>/dev/null)
if [ -n "$NEST_PID" ]; then
  echo "   Stopping NestJS server..."
  kill -9 $NEST_PID
fi

# Stop containers and remove volumes (⚠️ deletes database data)
echo "📦 Stopping containers and removing volumes..."
docker-compose down -v

# Remove unused Docker resources
echo "🗑️  Cleaning up unused Docker resources..."
docker system prune -f

echo "✨ Complete cleanup finished!"
echo "⚠️  Note: Database data has been deleted"
