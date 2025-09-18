# MiniMeet

Multi-User Video Chat Application using Nestjs, Typescript, TypeORM, Socket.io, WebRTC

## Motivation

To Build a Functioning Prototype of Real Time Video Chat Application using specific tech stack

## Goal

### 1.Backend Foundation

#### Problem Breakdown

- Data Persistence Problem: "How do we reliably store and manage user accounts and room information?"
- API Consistency Problem: "How do we provide predictable, type-safe interfaces for frontend consumption?"
- Architecture Scalability Problem: "How do we build modular code that won't become unmaintainable?"

MongoDB is likely used for the chat message, where the message entity itself can include various forms that includes attachments, images, videos, etc. For now, focus on building POC with SQL but add DTO on the message side to make this flexible and expandable later.

#### Deliverables

- [x] Room creation and management with participant tracking
- [x] RESTful API endpoints that frontend can consume
- [x] Database relationships that support complex real-time interactions
- [x] Error handling and validation
- [ ] Validated user registration/authentication system

### 2. Real-Time Communication Backend

### 3. Frontend

### 4. Performance, Feature, Deployment, Scalability

## Application Overview

### Core Features

- User registration/authentication
- Create/join video chat rooms
- 1-on-1 and group video calls (up to 4 participants for POC)
- Real-time text chat alongside video
- Chat history search
- Basic call analytics
- User presence indicators

### Technology Stack

#### Core Functionality

`Nestjs, Typescript, TypeOrm, Socket.io, WebRTC`

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
│   (React+TS)    │◄──►│   (NestJS+TS)    │◄──►│   (Janus Alt)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                 │
                    ┌────────────┼───────────┐
                    │            │           │
            ┌───────▼───┐ ┌──────▼───┐ ┌─────▼─────┐
            │ Socket.io │ │ Database │ │  Cache/   │
            │ Service   │ │ Services │ │ Analytics │
            └───────────┘ └──────────┘ └───────────┘
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
