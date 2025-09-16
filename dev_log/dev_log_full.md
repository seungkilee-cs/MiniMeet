# Dev Log

## Day 1

### 1. Database Setup

#### 1.1. Docker Setup

##### 1.1.1. Docker Compose Setup

```yml
# docker-compose.yml
version: "3.8"
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

Before installation, check if everything is in line. For me, I'm using M1 Mac, so arm64 setup verification.

```bash
# Check Node.js architecture
node -p "process.arch"  # Should show 'arm64'

# Check Docker platform
docker version | grep -i arch  # Should show 'arm64'
```

For my setup it looks like

```bash
Client OS/Arch: Should show darwin/arm64 (Mac M1)
Server OS/Arch: Should show linux/arm64 (Docker Desktop VM)
Version: Should be 27.x or 28.x (latest as of 2024-2025)
Context: Should show desktop-linux or default
```

Run docker compose once verified

```bash
# Test database containers
docker-compose up -d
```

##### 1.1.2. Docker Setup Verification

###### 1.1.2.1. All Conatiners Running

```bash
❯ docker ps
CONTAINER ID   IMAGE                                COMMAND                  CREATED              STATUS                   PORTS                               NAMES
a0b833c21894   redis:7-alpine                       "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:6379->6379/tcp              minimeet-redis
aeaa77fd0907   elasticsearch:8.8.0                  "/bin/tini -- /usr/l…"   About a minute ago   Up About a minute        0.0.0.0:9200->9200/tcp, 9300/tcp    minimeet-elasticsearch
2a0fd7dc529a   mysql:8.0                            "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:3306->3306/tcp, 33060/tcp   minimeet-mysql
f063858e895c   mongo:6.0                            "docker-entrypoint.s…"   About a minute ago   Up About a minute        0.0.0.0:27017->27017/tcp            minimeet-mongo
```

###### 1.1.2.2. MySQL Ready for Connection

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
docker exec -it minimeet-mysql mysql -u {SOME_USER} -p {SOME_PASSWORD} -e "SHOW DATABASES;"
```

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| minimeet           |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

###### 1.1.2.3. ElasticSearch Returns JSON Cluster

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

###### 1.1.2.4. Redis Ready for TCP

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

#### 1.2. NestJS Project Setup

##### 1.2.1. Nest Backend Creation

```bash
npm i -g @nestjs/cli
npx @nestjs/cli new minimeet-server
cd minimeet-server
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/config
```

##### 1.2.2. Connect DB to Nextjs

When I run `npm run start:dev` at `localhost:3000`` it should show hello world.

But I'm getting error with port listening error. Let's debug:

```bash
❯ lsof -i :3000
COMMAND     PID       USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
com.docke 54186 seungkilee  151u  IPv6 0x46d5b1034d895123      0t0  TCP *:hbci (LISTEN)
```

I see. The issue here is that running docker for mac (for the docker compose) is colliding with port 3000. So best way to handle this for me would be to change the port for NestJS. Change `minimeet-server/src/main.ts` so it listens to 3001 instead of 3000.

Okay. It works great. Now, let's actually connect using TypeORM.

##### 1.2.3. Nestjs TypeORM Configure

Update the `minimeet-server/src/app.module.ts` file

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

#### 1.3. Add NestJS Entity and Endpoints

##### 1.3.1. User Entity

Basic User Entity created at `src/users/entities/user.entity.ts`

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
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

Now, Generate the Module, Service, Controller, and implement basic functionalities.

```bash
# From minimeet-server/
npx nest generate module users
npx nest generate service users
npx nest generate controller users
```

##### 1.3.2. Users Module

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

##### 1.3.2. Users Service

Basic TypeORM functions for Create and Read operation. Inject Repository to the entity we created.

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // TypeORM methods
  async create(email: string, username: string): Promise<User> {
    const user = this.usersRepository.create({ email, username });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
```

##### 1.3.3. Users Controller

Basic controller for hitting the Services to invoke TypeORM methods.

```ts
import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: { email: string; username: string }) {
    return this.usersService.create(
      createUserDto.email,
      createUserDto.username,
    );
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }
}
```

##### 1.3.4. Debugging

Hmm, getting this error as I check the Nestjs server terminal

```bash
src/users/users.service.ts:23:5 - error TS2322: Type 'User | null' is not assignable to type 'User'.
  Type 'null' is not assignable to type 'User'.

23     return this.usersRepository.findOneBy({ id });
```

so it seems that in the TypeORM findOne method returns `User | null` instead of `User`. I guess I could just change `  async findOne(id: string): Promise<User>` to `Promise<User | null>`.

Is this the Nestjs best practice? -> Okay, so the best practice is the throw exception, which makes sense. I want it to fail early so I can catch the problem. This means I just have to change the findOne implementation to look like this

```ts
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
```

##### 1.3.5. Update app.module.ts

Oh, actually running npx nest generate automatically updates the app.module.ts to include then under imports. Sweet.

##### 1.3.6. Verify Connection

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

#### 1.4. CRUD Verification for User

Now that I have the entities and routes set up, let's verify.

##### 1.4.1. CREATE

Hit the endpoint we made on `user.controller`

```bash
# API Call
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","username":"johndoe"}'

# Response
{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}%

# TypeORM logging
query: START TRANSACTION
query: INSERT INTO `user`(`id`, `email`, `username`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, DEFAULT, DEFAULT, DEFAULT) -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c","john@example.com","johndoe"]
query: SELECT `User`.`id` AS `User_id`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User` WHERE `User`.`id` = ? -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c"]
query: COMMIT
```

##### 1.4.2. READ

###### 1.4.2.1. Get All Users

```bash
# API Call
curl http://localhost:3001/users

# Response
[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}]%

# TypeORM Log
query: SELECT `User`.`id` AS `User_id`, `User`.`email` AS `User_email`, `User`.`username` AS `User_username`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User`
```

###### 1.4.2.2. Get a Specific User

```bash
# API Call
curl http://localhost:3001/users/096959bc-8fa8-4f36-b0da-1d745783d67c

# Response
{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}%

# TypeORM Log
query: SELECT `User`.`id` AS `User_id`, `User`.`email` AS `User_email`, `User`.`username` AS `User_username`, `User`.`isActive` AS `User_isActive`, `User`.`createdAt` AS `User_createdAt`, `User`.`updatedAt` AS `User_updatedAt` FROM `user` `User` WHERE ((`User`.`id` = ?)) LIMIT 1 -- PARAMETERS: ["096959bc-8fa8-4f36-b0da-1d745783d67c"]
```

#### 1.5. Make Rooms Entity and Many to Many Addition

Now that I see the user entity and endpoints working, let's make the room entity as initially designed.

##### 1.5.1. API Routes for Rooms

Here is my plan for the generic endpoint for Room on CRUD operation. Add as needed.

```bash
POST   /rooms                          - Create room
GET    /rooms                          - List all rooms with participants
GET    /rooms/:id                      - Get specific room
POST   /rooms/:id/participants         - Add user to room
DELETE /rooms/:id/participants/:userId - Remove user from room
GET    /rooms/:id/participants         - List room participants
DELETE /rooms/:id                      - Delete room
```

So the tricky part is the mapping of many to many. I've established that rooms and users hold many to many relationship. How do I implement this in TypeORM? -> `@ManyToMany` decorator in TypeORM.

Create entity at `src/rooms/entities/room.entity.ts` and import User entity. Each room will hold an array of users. Set default room size to 4, for proof of concept.

So with the ManyToMany, which holds the relationship ownership? -> Room is the higher level aggregating entity between it and user. Also, right now I can't see if I would ever require room endpoint from the user side. So Room calls on User, so the relationship owner is room. I need to add join table decorator in room entity. Also need to add the forFeature in the room.module.

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity()
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 4 })
  maxParticipants: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => User, (user) => user.rooms, { cascade: true })
  @JoinTable()
  participants: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

##### 1.5.2. Rooms Module

Make sure to correctly import User entity for the correct relationship ownership

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { Room } from "./entities/room.entity";
import { User } from "../users/entities/user.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Room, User]), UsersModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
```

##### 1.5.3. Rooms Service

Implement the API routes I planned for the CRUD operation. I need to call on the UsersService for removing user from the room.

```ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Room } from "./entities/room.entity";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  async create(name: string, maxParticipants?: number): Promise<Room> {
    const room = this.roomsRepository.create({
      name,
      maxParticipants: maxParticipants || 4,
    });
    return this.roomsRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find({
      relations: ["participants"],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ["participants"],
    });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async addUserToRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    const user = await this.usersService.findOne(userId);

    // Check if room is at capacity
    if (room.participants.length >= room.maxParticipants) {
      throw new BadRequestException(`Room ${room.name} is at maximum capacity`);
    }

    // Check if user is already in room
    const isUserInRoom = room.participants.some(
      (participant) => participant.id === userId,
    );
    if (isUserInRoom) {
      throw new BadRequestException(
        `User ${user.username} is already in room ${room.name}`,
      );
    }

    room.participants.push(user);
    return this.roomsRepository.save(room);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<Room> {
    // Ensure room exists (throws NotFoundException if not found)
    const room = await this.findOne(roomId);

    // Ensure user exists (throws NotFoundException if not found)
    const user = await this.usersService.findOne(userId);

    // Check if user is actually in the room
    const participantIndex = room.participants.findIndex(
      (participant) => participant.id === userId,
    );

    if (participantIndex === -1) {
      throw new BadRequestException(
        `User ${user.username} is not a participant in room ${room.name}`,
      );
    }

    // Remove the user from participants
    room.participants.splice(participantIndex, 1);

    // Save and return updated room
    return this.roomsRepository.save(room);
  }

  async getRoomParticipants(roomId: string): Promise<User[]> {
    const room = await this.findOne(roomId);
    return room.participants;
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepository.remove(room);
  }
}
```

##### 1.5.4. Rooms Controller

```ts
import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(
    @Body() createRoomDto: { name: string; maxParticipants?: number },
  ) {
    return this.roomsService.create(
      createRoomDto.name,
      createRoomDto.maxParticipants,
    );
  }

  @Get()
  async findAll() {
    return this.roomsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.roomsService.findOne(id);
  }

  @Post(":id/participants")
  async addParticipant(
    @Param("id") roomId: string,
    @Body() addParticipantDto: { userId: string },
  ) {
    return this.roomsService.addUserToRoom(roomId, addParticipantDto.userId);
  }

  @Delete(":id/participants/:userId")
  async removeParticipant(
    @Param("id") roomId: string,
    @Param("userId") userId: string,
  ) {
    return this.roomsService.removeUserFromRoom(roomId, userId);
  }

  @Get(":id/participants")
  async getParticipants(@Param("id") roomId: string) {
    return this.roomsService.getRoomParticipants(roomId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.roomsService.remove(id);
  }
}
```

##### 1.5.5. Update User Entity

In User Entity, update to include the many to many relationship mapping. Each User will be able to join multiple rooms, so each user will hold array of Rooms.

```ts
import { Room } from '../../rooms/entities/room.entity';
...
...
...
  @ManyToMany(() => Room, (room) => room.participants)
  rooms: Room[];
```

##### 1.5.6. Verify Endpoint

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

##### 1.5.7. Response

```bash
# Create Room Response
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%

# Add user to existing room
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"participants":[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}],"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%

# Get room with participants
{"id":"71a35d00-6b41-4dd5-81b8-d1ec3ec676ea","name":"General Chat","maxParticipants":6,"isActive":true,"participants":[{"id":"096959bc-8fa8-4f36-b0da-1d745783d67c","email":"john@example.com","username":"johndoe","isActive":true,"createdAt":"2025-09-14T23:14:10.168Z","updatedAt":"2025-09-14T23:14:10.168Z"}],"createdAt":"2025-09-15T00:36:40.569Z","updatedAt":"2025-09-15T00:36:40.569Z"}%
```

##### 1.5.8. Add Automated Test for all Routes

---

## Day 2

### 2. Real Time Messaging and Video Signaling

#### 2.1. Socket.io Integration

Alright, so goal of this milestone is to set up a basic WebSocket server that can recognize when users connect and disconnect.

##### 2.1.1. Basic WebSocket Gateway

###### 2.1.1.1 Install WebSocket Dependencies

So for nestjs Websocket, I need to install dependencies

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

- `@nestjs/websockets`: The core package for WebSocket integration in NestJS.
- `@nestjs/platform-socket.io`: The adapter that allows NestJS to use Socket.io as its WebSocket library.

Now create nestjs gateway for video. Add to providers in app.module.ts -> actually, nestjs does this automatically

```bash
npx nest generate gateway video
```

###### 2.1.1.2. Implement the Gateway Placeholder Logic

now let's open up `minimeet-server/src/video/video.gateway.ts`

Let's write hooks for the `OnGatewayConnection` and `OnGatewayDisconnect` interfaces so NestJS to automatically execute the handling logic when a user connects or disconnects.

```typescript
// NestJS hooks to run the code when a user connects or disconnects

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  // cors for connecting frontend on different port
  cors: {
    origin: "*", // For development purposes only. In production, let's not do this.
  },
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // decorator to inject to get access to the underlying Socket.io server instance. Use to send msg
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger("VideoGateway");

  /**
   * a new client establishes a connection.
   * what do I pass in here -> client should be Socket object beacuse the socket object representing the connected client.
   * @param client socket object == connected client
   */
  handleConnection(client: Socket) {
    // This is where you add your console.log statement.
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * a connected client disconnects
   * Do I need any other param other than client? -> if this is socket obj than this should be all I need for the logic
   * @param client socket object == connected client
   */
  handleDisconnect(client: Socket) {
    // This is where you add your console.log statement.
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
```

###### 2.1.1.3. Verify the Connection to WebSocket server from Nestjs server using Socket.io

Now, let's test if it works.

For the purpose of testing the connection, I don't need a full app. I'm gonna just create a simple HTML file in `/test` directory and open the html in browser.

Test file at `minimeet-server/test/websocket-test.html`

```html
<!doctype html>
<html>
  <head>
    <title>WebSocket Test</title>
  </head>
  <body>
    <h1>Testing WebSocket Connection...</h1>
    <p>Open the developer console to see logs.</p>

    <!-- Load the Socket.io client library from a CDN -->
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

    <script>
      console.log("Attempting to connect to WebSocket server...");

      <!-- Change to 3001 as I updated in NestJS port -->
      const socket = io("http://localhost:3001");

      socket.on("connect", () => {
        console.log(
          "Successfully connected to the server! Socket ID:",
          socket.id,
        );
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from the server.");
      });

      socket.on("connect_error", (err) => {
        console.error("Connection failed:", err.message);
      });
    </script>
  </body>
</html>
```

When I open this html file in browser,

```bash
# In Browser Inspect
Attempting to connect to WebSocket server... websocket-test.html:14:15
Successfully connected to the server! Socket ID: IkjyLdxi3so9E4-2AAAD websocket-test.html:20:17

# In Nestjs server terminal - Connect
[Nest] 48835  - 09/16/2025, 2:10:59 PM     LOG [VideoGateway] Client connected: IkjyLdxi3so9E4-2AAAD

# In Nestjs server terminal - Disconnet
[Nest] 48835  - 09/16/2025, 2:11:29 PM     LOG [VideoGateway] Client disconnected: IkjyLdxi3so9E4-2AAAD
```

##### 2.1.2. Room Management via WebSocket

##### 2.1.3. WebSocket Authentication

##### 2.1.4. Basic Chat Functionality (POC)

#### 2.2. WebRTC Signaling Server (Built on Socket.io)

##### 2.2.1. Offer and Answer Exchange

##### 2.2.2. ICE Candidate Exchange

### 3. Frontend Setup

#### 3.1. React + TS Setup

### 4. WebRTC Video Handling

#### 4.1. WebRTC Signaling

#### 4.2. WebRTC Client Implementation

#### 4.3. Video Chat
