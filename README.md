# 💬 Real-Time Chat Application (WebSocket-Based)

A scalable, real-time chat application built using WebSockets with a controller-driven architecture.
The system supports private and group chats, real-time message delivery for online users, and is designed to scale horizontally using Redis Pub/Sub.

## Overview

This project demonstrates how to build a production-grade chat system using WebSockets while maintaining clean separation of concerns between:

- HTTP Controllers
- WebSocket Services
- Authentication
- Scalability mechanisms

The application ensures:

- Reliable message persistence
- Real-time updates for connected users
- Graceful handling of offline users
- Future-ready horizontal scaling

## Core Features

- JWT-based authentication (HTTP + WebSocket)
- Access & refresh token authentication
- Real-time messaging using WebSocket
- Room-based message broadcasting
- Private & group chat support
- Redis Pub/Sub support for horizontal scaling
- Clean separation of controllers and WebSocket services
- Unit testing with mocking
- Centralized error handling
- Stateless REST APIs
- Event-driven message emission

## Tech Stack

### Backend

**TypeScript, Node.js, Express.js, WebSocket (ws), PostgreSQL, Prisma ORM, Redis (Pub/Sub), JWT Authentication**

### Frontend

**React, TypeScript, Tailwind CSS, WebSocket Client**

## High-Level Flow

### User Authentication

Complete authentication flow with email verification, password reset, and access & refresh tokens.

### WebSocket Connection

- Client connects to WebSocket using an access token
- Server authenticates the socket connection
- User is tracked as an online client

### Chat Subscription

When the user opens the chat page:

- REST API fetches the user’s chat list
- Controller subscribes the user to relevant chat rooms on the WebSocket server

### Sending Messages

Message is sent via REST API

**Controller:**

- Saves message to the database
- Emits real-time updates via WebSocket to online participants
- Offline users can be handled by notification systems (future extension)

**Receiving Messages:**

- Online users receive messages instantly via WebSocket
- UI updates without polling

## Why Controller-Based WebSocket Integration?

Instead of letting clients manage WebSocket subscriptions directly:

- Controllers orchestrate business logic
- WebSocket service focuses only on real-time delivery
- Authentication, authorization, and validation remain centralized
- Improves maintainability and scalability

## 🎯 Key Takeaways

- WebSocket is used strictly for real-time delivery
- Database remains the source of truth
- Controllers handle business logic
- WebSocket service handles message fan-out
- Designed to scale horizontally without refactoring core logic
