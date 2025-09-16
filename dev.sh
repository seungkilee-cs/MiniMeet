#!/usr/bin/env bash

case "$1" in
start)
  ./_scripts/start_minimeet_dev.sh
  ;;
end)
  ./_scripts/stop_minimeet_dev.sh
  ;;
restart)
  ./_scripts/stop_minimeet_dev.sh
  sleep 2
  ./_scripts/start_minimeet_dev.sh
  ;;
clean)
  ./_scripts/cleanup_minimeet_dev.sh
  ;;
show)
  echo "Docker containers:"
  docker ps --format "table {{.Names}}\t{{.Status}}"
  echo ""
  echo "NestJS server:"
  if lsof -i :3001 >/dev/null 2>&1; then
    echo "✅ Running on http://localhost:3001"
  else
    echo "❌ Not running"
  fi
  ;;
*)
  echo "Usage: $0 {start|end|restart|clean|show}"
  echo ""
  echo "Commands:"
  echo "  start   - Start development environment"
  echo "  end     - Stop development environment"
  echo "  restart - Restart development environment"
  echo "  clean   - Stop and remove all data (⚠️ destructive)"
  echo "  show  - Show current status"
  exit 1
  ;;
esac
