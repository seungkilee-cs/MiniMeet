# Dev Log

## Day 1

### Database Setup

```
# Install nestjs
node --version  # In case someone has Node.js prior to 18
npm install -g @nestjs/cli
docker --version  # For database containers
```

#### Docker Compose Setup

```
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: minimeet-mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: minimeet
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  mongodb:
    image: mongo:6.0
    container_name: minimeet-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: minimeet-redis
    ports:
      - "6379:6379"

volumes:
  mysql_data:
  mongo_data:
```

And verify installation setup. For me, I'm using M1 Mac, so arm64 setup verification

```
# Check Node.js architecture
node -p "process.arch"  # Should show 'arm64'

# Check Docker platform
docker version | grep -i arch  # Should show 'arm64'
```

For my setup should look for

```
Client OS/Arch: Should show darwin/arm64 (Mac M1)
Server OS/Arch: Should show linux/arm64 (Docker Desktop VM)
Version: Should be 27.x or 28.x (latest as of 2024-2025)
Context: Should show desktop-linux or default
```

Run once verified

```
# Test database containers
docker-compose up -d
docker ps  # All containers should be running

```

#### NestJS Project Setup

##### Nest Backend Creation

```
npx @nestjs/cli new minimeet-server
cd minimeet-server
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/config

``

#### Database Connections

#### First Entity & CRUD

#### Room Entity & Relationships

### Real Time Handling

#### Socket.io Integration

#### Room Management via WebSocket

### Frontend Setup

#### React + TS Setup

### WebRTC Video Handling

#### WebRTC Signaling

#### WebRTC Client Implementation

#### Video Chat
```
