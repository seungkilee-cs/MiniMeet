# minimeet

Video Chat Application using Nestjs, Typescript, Socketio

## Application Overview

### Core Features

- User registration/authentication
- Create/join video chat rooms
- 1-on-1 and group video calls (up to 4 participants)
- Real-time text chat alongside video
- Chat history search
- Basic call analytics
- User presence indicators

### Technology Stack

#### As Is

`Nestjs, Typescript, TypeOrm, Socket.io, WebRTC, Peerjs`

#### Alternative

```
- AWS EKS                 -> Docker Compose (Local development, easier setup)
- AWS DocumentDB(MongoDB) -> MongoDB (Same API, free for development)
- AWS Aurora(MySQL)       -> MySQL (Same database engine)
- Janus Gateway           -> Simple WebRTC SFU (Open source alternative)
- AWS ElasticSearch       -> ElasticSearch on Docker (Same technology, containerized)
- Apache Kafka            -> Redis Streams (Simpler setup, similar functionality)
```

### Backend Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │  Media Server   │
│   (React+TS)    │◄──►│   (NestJS)       │◄──►│   (Janus Alt)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼──┐ ┌──────▼──┐ ┌─────▼─────┐
            │ Socket.io│ │Database │ │  Cache/   │
            │ Service  │ │Services │ │ Analytics │
            └──────────┘ └─────────┘ └───────────┘
```

### Service Breakdown

#### API Gateway Service (NestJS + TypeScript)

```
// Core modules structure
src/
├── auth/           # JWT authentication
├── users/          # User management
├── rooms/          # Video room management
├── chat/           # Chat message handling
├── websocket/      # Socket.io gateway
├── analytics/      # Call metrics
└── common/         # Shared utilities

```

#### Database Layer (TypeORM)

```
// Entity relationships
User ──┐
       ├─► Room (many-to-many)
       └─► ChatMessage (one-to-many)

Room ──┐
       ├─► ChatMessage (one-to-many)
       └─► CallSession (one-to-many)

```

#### Real-time Communication (Socket.io + WebRTC)

```
// WebSocket event handlers
- 'join_room' → Room management
- 'leave_room' → Cleanup connections
- 'webrtc_offer' → Peer connection signaling
- 'webrtc_answer' → Response handling
- 'ice_candidate' → Network traversal
- 'chat_message' → Text messaging

```
