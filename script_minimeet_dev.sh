#!/usr/bin/env bash

case "$1" in
start)
  ./start_minimeet_dev.sh
  ;;
stop)
  ./stop_minimeet_dev.sh
  ;;
restart)
  ./stop_minimeet_dev.sh
  sleep 2
  ./start_minimeet_dev.sh
  ;;
clean)
  ./cleanup_minimeet_dev.sh
  ;;
status)
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
  echo "Usage: $0 {start|stop|restart|clean|status}"
  echo ""
  echo "Commands:"
  echo "  start   - Start development environment"
  echo "  stop    - Stop development environment"
  echo "  restart - Restart development environment"
  echo "  clean   - Stop and remove all data (⚠️ destructive)"
  echo "  status  - Show current status"
  exit 1
  ;;
esac
