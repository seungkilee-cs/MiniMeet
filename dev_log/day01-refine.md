# MiniMeet Video Chat Application - Development Log

## Project Overview

**Goal:** Build a video chat application using NestJS + WebRTC + Socket.io to demonstrate Korean job posting tech stack
**Tech Stack:** NestJS, TypeScript, TypeORM, MySQL, MongoDB, Redis, ElasticSearch, Docker, AWS (future)

---

## Day 1 - Infrastructure & Database Foundation

**Date:** September 15, 2025
**Focus:** Docker setup, NestJS initialization, MySQL connection

### 🎯 Milestones Achieved

- [x] Docker multi-database environment running
- [x] NestJS project initialized and serving
- [x] TypeORM connected to MySQL
- [x] User entity CRUD operations working

### 🛠️ Environment Setup

#### System Verification (Mac M1)

```
# Architecture verification
node -p "process.arch"          # ✅ Expected: arm64
docker version | grep -i arch   # ✅ Expected: darwin/arm64 + linux/arm64
```

#### Docker Infrastructure

**File:** `docker-compose.yml`

```
services:
  mysql:
    image: mysql:8.0
    container_name: minimeet-mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: minimeet
    ports: ["3306:3306"]
    volumes: [mysql_data:/var/lib/mysql]

  # ... other services (mongodb, redis, elasticsearch)
```

**Verification Commands:**

```
docker-compose up -d
docker ps  # ✅ All 4 containers running
curl http://localhost:9200  # ✅ ElasticSearch responds
docker exec -it minimeet-mysql mysql -u root -ppassword -e "SHOW DATABASES;"  # ✅ minimeet DB exists
```

### 🚀 NestJS Application Setup

#### Project Initialization

```
npx @nestjs/cli new minimeet-server --package-manager npm
cd minimeet-server
npm install @nestjs/typeorm typeorm mysql2 @nestjs/config
```

#### Configuration Updates

**File:** `src/main.ts`

```
// Fixed port conflict with Docker Desktop
await app.listen(process.env.PORT ?? 3001);  // ✅ Professional env-aware approach
```

**File:** `src/app.module.ts`

```
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'minimeet',
  autoLoadEntities: true,
  synchronize: true,  // Development only
  logging: true,      // Detailed SQL logging
})
```

### 🏗️ User Entity Implementation

#### Generated Structure

```
npx nest generate module users
npx nest generate service users
npx nest generate controller users
```

#### Entity Definition

**File:** `src/users/entities/user.entity.ts`

```
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 🐛 Issues & Solutions

#### Issue 1: Port Conflict

**Problem:** `EADDRINUSE: address already in use :::3000`

```
lsof -i :3000  # Found: com.docke (Docker Desktop) using port 3000
```

**Solution:** Changed NestJS to use environment-aware port configuration
**Learning:** Docker Desktop for Mac reserves port 3000; use dynamic ports for flexibility

#### Issue 2: TypeScript Type Error

**Problem:** `Type 'User | null' is not assignable to type 'User'`
**Root Cause:** TypeORM's `findOneBy()` returns `User | null`
**Solution:** Implemented NestJS best practice with NotFoundException

```
async findOne(id: string): Promise<User> {
  const user = await this.usersRepository.findOneBy({ id });
  if (!user) {
    throw new NotFoundException(`User with id ${id} not found`);
  }
  return user;
}
```

**Learning:** Fail-fast error handling is preferred in NestJS services

### ✅ Verification & Testing

#### Database Connection Verification

**Server Startup Logs:** (Success Indicators)

```
[InstanceLoader] TypeOrmModule dependencies initialized +35ms
[InstanceLoader] UsersModule dependencies initialized +0ms
[RouterExplorer] Mapped {/users, POST} route
[RouterExplorer] Mapped {/users, GET} route
[RouterExplorer] Mapped {/users/:id, GET} route
```

**SQL Query Logs:** (Detailed logging enabled)

```
-- Connection verification
SELECT version()
SELECT DATABASE() AS `db_name`

-- Schema introspection
SELECT `TABLE_SCHEMA`, `TABLE_NAME`, `TABLE_COMMENT`
FROM `INFORMATION_SCHEMA`.`TABLES`
WHERE `TABLE_SCHEMA` = 'minimeet' AND `TABLE_NAME` = 'user'
```

#### CRUD Operations Testing

| Operation    | Endpoint         | Status | Response Time | SQL Generated           |
| ------------ | ---------------- | ------ | ------------- | ----------------------- |
| **CREATE**   | `POST /users`    | ✅ 201 | ~50ms         | `INSERT INTO user`      |
| **READ ALL** | `GET /users`     | ✅ 200 | ~30ms         | `SELECT * FROM user`    |
| **READ ONE** | `GET /users/:id` | ✅ 200 | ~25ms         | `SELECT * WHERE id = ?` |

**Test Commands:**

```
# Create user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","username":"johndoe"}'

# Verify response: UUID generated, timestamps added, all fields populated
```

### 📈 Current Capabilities

**What I can demonstrate:**

- Multi-database Docker environment (MySQL, MongoDB, Redis, ElasticSearch)
- NestJS backend with proper TypeORM integration
- RESTful CRUD API with UUID primary keys and automatic timestamps
- Professional error handling with HTTP status codes
- Detailed SQL query logging for debugging
- Environment-aware configuration (port, database credentials)

### 🎯 Next Session Goals

- [ ] Room entity with many-to-many User relationships
- [ ] Socket.io integration for real-time communication
- [ ] WebRTC signaling server setup
- [ ] Basic video chat proof-of-concept

---

## Development Scripts

**File:** `start_minimeet_dev.sh`

```
#!/bin/bash
echo "🚀 Starting MiniMeet development environment..."
docker-compose up -d
sleep 8
cd minimeet-server && npm run start:dev
```

**File:** `stop_minimeet_dev.sh`

```
#!/bin/bash
NEST_PID=$(lsof -i :3001 -t 2>/dev/null)
[ -n "$NEST_PID" ] && kill -9 $NEST_PID
docker-compose down
```

```

## **Key Improvements in This Structure:**

### **1. Clear Milestone Tracking**
- ✅/❌ checkboxes for visual progress
- Specific, testable achievements
- Clear success criteria

### **2. Problem-Solution Documentation**
- **Issue → Root Cause → Solution → Learning**
- Helps future debugging and knowledge transfer
- Documents decision-making process

### **3. Verification Evidence**
- Specific commands and expected outputs
- Logs that prove functionality
- Test results table format

### **4. Professional Organization**
- Consistent formatting and emoji indicators
- Logical flow: Setup → Implementation → Testing → Next Steps
- Easy to scan and reference

### **5. Knowledge Retention Focus**
- "Learning" sections capture insights
- "Current Capabilities" shows progress
- Links technical implementation to business value

This structure scales well as your project grows and provides excellent documentation for portfolio presentations or technical interviews!
```
