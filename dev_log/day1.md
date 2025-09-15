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
```

- [x] run npm run start:dev -> localhost:3000 shows hello world

#### Testing setup

```bash
❯ docker ps
CONTAINER ID   IMAGE                                COMMAND                  CREATED              STATUS                   PORTS                               NAMES
a0b833c21894   redis:7-alpine                       "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:6379->6379/tcp              minimeet-redis
aeaa77fd0907   elasticsearch:8.8.0                  "/bin/tini -- /usr/l…"   About a minute ago   Up About a minute        0.0.0.0:9200->9200/tcp, 9300/tcp    minimeet-elasticsearch
2a0fd7dc529a   mysql:8.0                            "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:3306->3306/tcp, 33060/tcp   minimeet-mysql
f063858e895c   mongo:6.0                            "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:27017->27017/tcp            minimeet-mongo
```

- [x] MySQL ready for connection

```bash
❯ docker logs minimeet-mysql
2025-09-15 06:16:24+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.43-1.el9 started.
2025-09-15 06:16:25+00:00 [Note] [Entrypoint]: Switching to dedicated user 'mysql'
2025-09-15 06:16:25+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.43-1.el9 started.
2025-09-15 06:16:25+00:00 [Note] [Entrypoint]: Initializing database files
2025-09-15T06:16:25.248320Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2025-09-15T06:16:25.535990Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2025-09-15 06:16:28+00:00 [Note] [Entrypoint]: Database files initialized
2025-09-15 06:16:28+00:00 [Note] [Entrypoint]: Starting temporary server
2025-09-15T06:16:28.899032Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
2025-09-15T06:16:28.899058Z 0 [System] [MY-013602] [Server] Channel mysql_main configured to support TLS. Encrypted connections are now supported for this channel.
2025-09-15T06:16:28.908980Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.43'  socket: '/var/run/mysqld/mysqld.sock'  port: 0  MySQL Community Server - GPL.
```

```bash
docker exec -it minimeet-mysql mysql -u root -ppassword -e "SHOW DATABASES;"
```

```
# expected output
+--------------------+
| Database           |
+--------------------+
| information_schema |
| minimeet           |   ← database exists!
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

- [x] ElasticSearch returns JSON cluster

```bash
❯ curl http://localhost:9200
{
  "name" : "aeaa77fd0907",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "6fcgYs6pS22DpgHTeoGXug",
  "version" : {
    "number" : "8.8.0",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "c01029875a091076ed42cdb3a41c10b1a9a5a20f",
    "build_date" : "2023-05-23T17:16:07.179039820Z",
    "build_snapshot" : false,
    "lucene_version" : "9.6.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

- [x] Redis ready for tcp

```bash
❯ docker logs minimeet-redis
1:C 15 Sep 2025 06:16:25.007 * oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
1:C 15 Sep 2025 06:16:25.007 * Redis version=7.4.5, bits=64, commit=00000000, modified=0, pid=1, just started
1:C 15 Sep 2025 06:16:25.007 # Warning: no config file specified, using the default config. In order to specify a config file use redis-server /path/to/redis.conf
1:M 15 Sep 2025 06:16:25.016 * monotonic clock: POSIX clock_gettime
1:M 15 Sep 2025 06:16:25.019 * Running mode=standalone, port=6379.
1:M 15 Sep 2025 06:16:25.019 * Server initialized
1:M 15 Sep 2025 06:16:25.019 * Ready to accept connections tcp
```

#### Connect to Nextjs

- Getting error with port listening error. Let's debug:

```bash
❯ lsof -i :3000
COMMAND     PID       USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 54186 seungkilee  151u  IPv6 0x46d5b1034d895123      0t0  TCP *:hbci (LISTEN)
```

I see. the issue here is that running docker for mac (for the docker compose) is colliding with port 3000. So best way to handle this for me would be to change the port for Nestjs. change `minimeet-server/src/main.ts` so it listens to 3001 instead of 3000.

OKay. It works great. Now, let's actually connect using TypeORM.

##### TypeORM Configure

change `minimeet-server/src/app.module.ts` file to

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "password",
      database: "minimeet",
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### First Entity

Generate Module, Service, Controller, and implement basic functionalities.

```bash
# From minimeet-server/
npx nest generate module users
npx nest generate service users
npx nest generate controller users
```

##### Module

##### Service

##### Controller

##### Debugging

Getting this error

```bash
src/users/users.service.ts:23:5 - error TS2322: Type 'User | null' is not assignable to type 'User'.
  Type 'null' is not assignable to type 'User'.

23     return this.usersRepository.findOneBy({ id });
```

so it seems that in the TypeORM findOne method returns `User | null` instead of `User`. I guess I could just change `  async findOne(id: string): Promise<User>` to `Promise<User | null>`. Is this the Nestjs best practice? -> Okay, so the best practice is the throw exception, which makes sense. I want it to fail early so I can catch the problem. This means I just have to change the findOne implementation to look like this

```ts
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
```

##### Verify Connection

Now, let's see if the connection is made on nestjs when I run `npm run start:dev`

```bash
[4:59:45 PM] Starting compilation in watch mode...

[4:59:46 PM] Found 0 errors. Watching for file changes.

[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [NestFactory] Starting Nest application...
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +35ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] ConfigHostModule dependencies initialized +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] AppModule dependencies initialized +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] ConfigModule dependencies initialized +0ms
query: SELECT version()
query: START TRANSACTION
query: SELECT DATABASE() AS `db_name`
query: SELECT `TABLE_SCHEMA`, `TABLE_NAME`, `TABLE_COMMENT` FROM `INFORMATION_SCHEMA`.`TABLES` WHERE `TABLE_SCHEMA` = 'minimeet' AND `TABLE_NAME` = 'user'
query:
                SELECT
                    *
                FROM
                    `INFORMATION_SCHEMA`.`COLUMNS`
                WHERE
                    `TABLE_SCHEMA` = 'minimeet'
                    AND
                    `TABLE_NAME` = 'user'

query: SELECT * FROM (
                SELECT
                    *
                FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE` `kcu`
                WHERE
                    `kcu`.`TABLE_SCHEMA` = 'minimeet'
                    AND
                    `kcu`.`TABLE_NAME` = 'user'
            ) `kcu` WHERE `CONSTRAINT_NAME` = 'PRIMARY'
query:
            SELECT
                `SCHEMA_NAME`,
                `DEFAULT_CHARACTER_SET_NAME` as `CHARSET`,
                `DEFAULT_COLLATION_NAME` AS `COLLATION`
            FROM `INFORMATION_SCHEMA`.`SCHEMATA`

query:
            SELECT
                `s`.*
            FROM (
                SELECT                                                                                                                                                                                 *
                FROM `INFORMATION_SCHEMA`.`STATISTICS`
                WHERE
                    `TABLE_SCHEMA` = 'minimeet'
                    AND
                    `TABLE_NAME` = 'user'
            ) `s`                                                                                                                                                                              LEFT JOIN (
                SELECT
                    *                                                                                                                                                                              FROM `INFORMATION_SCHEMA`.`REFERENTIAL_CONSTRAINTS`
                WHERE
                    `CONSTRAINT_SCHEMA` = 'minimeet'
                    AND
                    `TABLE_NAME` = 'user'
            ) `rc`
                ON
                    `s`.`INDEX_NAME` = `rc`.`CONSTRAINT_NAME`
                    AND
                    `s`.`TABLE_SCHEMA` = `rc`.`CONSTRAINT_SCHEMA`
            WHERE
                `s`.`INDEX_NAME` != 'PRIMARY'
                AND
                `rc`.`CONSTRAINT_NAME` IS NULL

query:
            SELECT
                `kcu`.`TABLE_SCHEMA`,
                `kcu`.`TABLE_NAME`,
                `kcu`.`CONSTRAINT_NAME`,
                `kcu`.`COLUMN_NAME`,
                `kcu`.`REFERENCED_TABLE_SCHEMA`,
                `kcu`.`REFERENCED_TABLE_NAME`,
                `kcu`.`REFERENCED_COLUMN_NAME`,
                `rc`.`DELETE_RULE` `ON_DELETE`,
                `rc`.`UPDATE_RULE` `ON_UPDATE`
            FROM (
                SELECT                                                                                                                                                                                 *
                FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE` `kcu`
                WHERE
                    `kcu`.`TABLE_SCHEMA` = 'minimeet'
                    AND
                    `kcu`.`TABLE_NAME` = 'user'
            ) `kcu`
            INNER JOIN (
                SELECT
                    *
                FROM `INFORMATION_SCHEMA`.`REFERENTIAL_CONSTRAINTS`
                WHERE
                    `CONSTRAINT_SCHEMA` = 'minimeet'
                    AND
                    `TABLE_NAME` = 'user'
            ) `rc`
                ON
                    `rc`.`CONSTRAINT_SCHEMA` = `kcu`.`CONSTRAINT_SCHEMA`
                    AND
                    `rc`.`TABLE_NAME` = `kcu`.`TABLE_NAME`
                    AND
                    `rc`.`CONSTRAINT_NAME` = `kcu`.`CONSTRAINT_NAME`

query: SELECT * FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = 'minimeet' AND `TABLE_NAME` = 'typeorm_metadata'
query: COMMIT
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] TypeOrmCoreModule dependencies initialized +69ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [InstanceLoader] UsersModule dependencies initialized +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RoutesResolver] AppController {/}: +1ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RoutesResolver] UsersController {/users}: +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RouterExplorer] Mapped {/users, POST} route +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RouterExplorer] Mapped {/users, GET} route +0ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [RouterExplorer] Mapped {/users/:id, GET} route +1ms
[Nest] 73595  - 09/15/2025, 4:59:47 PM     LOG [NestApplication] Nest application successfully started +1ms
```

I have logging set to true in TypeORM setup, so the actual SQL shows

- [x] Database Connection Established -> TypeORM connect to MySQL

```bash
query: SELECT version()
query: START TRANSACTION
query: SELECT DATABASE() AS `db_name`
...
```

- [x] User Entity Recognized -> TypeORM checks for User entity table and read the data

```bash
query: SELECT `TABLE_SCHEMA`, `TABLE_NAME`, `TABLE_COMMENT` FROM `INFORMATION_SCHEMA`.`TABLES` WHERE `TABLE_SCHEMA` = 'minimeet' AND `TABLE_NAME` = 'user'
```

- [x] Modules Loaded Successfully -> Both TypeORM and your Users module loaded.

```bash
[InstanceLoader] TypeOrmModule dependencies initialized +35ms
[InstanceLoader] UsersModule dependencies initialized +0ms
```

- [x] API Routes Active -> CRUD endpoints are accessible and mapped.

```bash
[RouterExplorer] Mapped {/users, POST} route
[RouterExplorer] Mapped {/users, GET} route
[RouterExplorer] Mapped {/users/:id, GET} route
```

#### CRUD for User

##### CREATE

- API Call

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","username":"johndoe"}'
```

- Response

```bash
{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}%
```

- TypeORM logging

```bash
query: START TRANSACTION
query: INSERT INTO `user`(`id`, `email`, `username`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, DEFAULT, DEFAULT, DEFAULT) -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c","john@example.com","johndoe"]
query: SELECT `User`.`id` AS `User_id`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User` WHERE `User`.`id` = ? -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c"]
query: COMMIT
```

##### READ

###### All Users

- API Call

```bash
curl http://localhost:3001/users
```

- Response

```bash
[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}]%
```

- TypeORM Log

```bash
query: SELECT `User`.`id` AS `User_id`, `User`.`email` AS `User_email`, `User`.`username` AS `User_username`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User`
```

###### Specific Users

- API Call

```bash
curl http://localhost:3001/users/096959bc-8fa8-4f36-b0da-1d745783d67c
```

- Response

```bash
{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}%
```

- TypeORM Log

```bash
query: SELECT `User`.`id` AS `User_id`, `User`.`email` AS `User_email`, `User`.`username` AS `User_username`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User` WHERE ((`User`.`id` = ?)) LIMIT 1 -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c"]
```

#### Room Entity & Relationships

##### API Routes for rooms

```bash
POST   /rooms                     - Create room
GET    /rooms                     - List all rooms with participants
GET    /rooms/:id                 - Get specific room
POST   /rooms/:id/participants    - Add user to room
DELETE /rooms/:id/participants/:userId - Remove user from room
GET    /rooms/:id/participants    - List room participants
DELETE /rooms/:id                 - Delete room
```

##### Call API

```bash
# Create room
curl -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"General Chat","maxParticipants":6}'

# Add user to room
curl -X POST http://localhost:3001/rooms/ROOM_ID/participants \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'

# Get room with participants
curl http://localhost:3001/rooms/ROOM_ID
```

##### Response

```bash
# Create Room Response
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%

# Add user to existing room
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"participants":[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}],"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%

# Get room with participants
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"participants":[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}],"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%
```

## Day 2

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

```
