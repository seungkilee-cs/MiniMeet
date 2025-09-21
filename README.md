# MiniMeet

<!-- > [한글](README.ko.md)로도 볼 수 있습니다. -->

Multi-User Video Chat Application using NestJS, TypeScript, TypeORM, Socket.IO, WebRTC

## Motivation

To build a functioning prototype of a real-time video chat application using a specific tech stack, demonstrating enterprise-grade architecture patterns and distributed systems principles.

## Current Status

Completed Milestones:

- Backend Foundation : NestJS API with TypeORM, MySQL integration
- Authentication System : JWT-based auth with WebSocket security guards
- Real-Time Chat : Socket.IO messaging with DTO validation

🚧 In Progress:

- WebRTC Video Implementation (Milestone 2.5): Peer-to-peer video streaming
- React + TypeScript Frontend: Production-ready client interface

## Goal & Roadmap

### 1. Backend Foundation and Real Time Chat

#### Problem Breakdown & Solutions

- Data Persistence: Reliable user accounts and room management with TypeORM + MySQL
- API Consistency: Type-safe DTOs with class-validator for robust data contracts
- Architecture Scalability: Modular NestJS structure with dependency injection

#### Deliverables

- [x] Room creation and management with participant tracking
- [x] RESTful API endpoints with full type safety
- [x] Database relationships supporting real-time interactions
- [x] Comprehensive error handling and DTO validation (Needed for MongoDB Key-Document message Support)
- [x] JWT authentication system with WebSocket security
- [x] Real-time text chat with message persistence
- [x] WebSocket authentication guards and session management

### 2. Real Time Video Communication

#### Problem Breakdown

- WebRTC Signaling: Implement offer/answer/ICE candidate exchange via Socket.IO
- Peer Connection Management: Handle 1-on-1 and multi-party video calls
- Media Stream Coordination: Camera/microphone access and stream sharing
- Network Resilience: Handle NAT traversal, connection failures, and reconnections

#### Deliverables

- [x] WebRTC signaling server implementation
- [ ] 1-on-1 video call functionality
- [ ] Multi-party video calls (up to 4 participants)
- [ ] Media device management (camera/microphone toggle)
- [x] Connection state management and error recovery

### 3. Frontend

#### Technology Choice: React + TypeScript

- Component Reusability: Modular UI components
- Type Safety: Shared DTOs between frontend and backend
- State Management: Complex real-time UI state handling
- Production Scale: Professional UX for real users

#### Deliverables

- [x] React + TypeScript project scaffold
- [x] Authenticated routing and session management
- [x] Real-time chat interface with DTO validation
- [ ] Video call UI with WebRTC integration
- [ ] Responsive design for desktop and mobile

### 4. Performance & Scalability

- [ ] Redis integration for session management and caching
- [ ] MongoDB for flexible message storage and attachments
- [ ] ElasticSearch for chat history search
- [ ] Load balancing and horizontal scaling
- [ ] Production deployment with Docker

## Application Overview

### Core Features

- [x] JWT-based user authentication
- [x] Create/join video chat rooms with real-time presence
- [x] Real-time text chat with message persistence
- [x] WebSocket authentication and authorization
- [x] DTO-validated message handling
- [ ] 1-on-1 and group video calls (WebRTC)
- [ ] React + TypeScript frontend interface
- [ ] Video call controls (mute, camera toggle)
- [ ] Chat history search (ElasticSearch)
- [ ] Call analytics and user presence indicators

### Technology Stack

#### Core Implementation

Backend: `NestJS + TypeScript + TypeORM + Socket.IO + WebRTC`
Frontend: `React + TypeScript + Socket.IO Client`
Database: `MySQL (TypeORM)`

#### Development vs Production

```
Development (Current):
- MySQL                    -> Simple relational data
- Socket.IO               -> Real-time communication
- HTML Test Clients       -> Rapid prototyping
- Local development       -> Easy setup and testing

Production (Planned):
- AWS Aurora (MySQL)      -> Managed relational database
- Redis                   -> Session management and caching
- MongoDB                 -> Flexible message content storage
- ElasticSearch           -> Fast full-text search
- React + TS Frontend     -> Professional user interface
- Docker Compose          -> Containerized deployment
```

### Backend Architecture

```
┌─────────────────┐    ┌──────────────────────────────────┐
│   Test Client   │    │         NestJS Backend           │
│                 │◄──►│  ┌─────────────────────────────┐ │
└─────────────────┘    │  │     VideoGateway            │ │
                       │  │   (Socket.IO + Auth)        │ │
                       │  └─────────────────────────────┘ │
                       │  ┌─────────┬─────────┬─────────┐ │
                       │  │  Auth   │  Rooms  │Messages │ │
                       │  │ Module  │ Module  │ Module  │ │
                       │  └─────────┴─────────┴─────────┘ │
                       └──────────────────────────────────┘
                                         │
                                ┌────────▼────────┐
                                │ MySQL Database  │
                                │   (TypeORM)     │
                                └─────────────────┘
```

### Final Architecture With Frontend

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React + TS    │    │   NestJS API     │    │  Media Services │
│   Frontend      │◄──►│   Gateway        │◄──►│  (WebRTC SFU)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                 │
                    ┌────────────┼───────────┐
                    │            │           │
            ┌───────▼───┐ ┌──────▼───┐ ┌─────▼─────┐
            │ Socket.io │ │ Database │ │   Redis   │
            │  Gateway  │ │ Services │ │  Cache    │
            └───────────┘ └──────────┘ └───────────┘
```

## Implementation Details

### Current Module Structure

```
src/
├── auth/              # JWT authentication & WebSocket guards
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── ws-auth.guard.ts
├── users/             # User entity and management
├── rooms/             # Video room management with participants
│   ├── rooms.service.ts
│   └── entities/room.entity.ts
├── messages/          # Real-time chat with DTO validation
│   ├── messages.service.ts
│   ├── entities/message.entity.ts
│   └── dto/
│       ├── create-message.dto.ts
│       └── load-message-history.dto.ts
├── video/             # WebRTC signaling (in progress)
│   └── video.gateway.ts
└── common/            # Shared utilities and guards
```

### Database Schema (TypeORM)

```
User ──┐
       ├─► Room (many-to-many participants)
       └─► Message (one-to-many sender)
Room ──┐
       ├─► Message (one-to-many room)
       └─► CallSession (one-to-many, planned)
```

### WebSocket Events (Implemented)

```typescript
// Authentication & Room Management
'joinRoom' → Room participation with database sync
'leaveRoom' → Clean disconnection and state update
'participantsUpdate' → Real-time presence broadcasting

// Real-Time Chat
'sendMessage' → DTO-validated message creation
'newMessage' → Real-time message broadcasting
'loadMessageHistory' → Persistent chat history
'messageError' → Validation error feedback

// WebRTC Signaling (Planned)
'webrtc-offer' → Peer connection initiation
'webrtc-answer' → Connection response handling
'ice-candidate' → Network traversal coordination
```

## Testing & Validation

### Testing Approach

- [x] Multi-user scenarios: Different users in same room
- [ ] Authentication flow: JWT token generation and WebSocket auth
- [x] Real-time updates: Message broadcasting and participant management
- [x] DTO validation: Client and server-side input validation
- [ ] Error handling: Graceful failure scenarios and user feedback

## Next Steps

### P0. Immediate

1. Implement WebRTC signaling handlers in VideoGateway
2. Add peer connection management for 1-on-1 calls
3. Integrate getUserMedia() for camera/microphone access
4. Handle ICE candidate exchange and connection states
5. Test video calls between two clients

### P1. Short-term: Frontend

1. Scaffold React + TypeScript project structure
2. Implement shared DTO types between frontend and backend
3. Create authentication flow and protected routes
4. Build chat interface components with real-time updates
5. Integrate WebRTC functionality into React components

### P2. Long-term: Production Features

1. Multi-party video calls with SFU architecture
2. Redis integration for scalable session management
3. MongoDB for rich message content and file attachments
4. ElasticSearch for chat history search capabilities
5. Docker containerization and cloud deployment
