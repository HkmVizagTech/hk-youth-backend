# Hare Krishna Youth — Backend

Real-time Node.js + Express + MongoDB + Socket.IO backend for the **Hare Krishna Youth**  (HKY) application.

## Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express
- **Database**: MongoDB (Mongoose ODM)
- **Real-Time**: Socket.IO
- **Auth**: JWT + bcrypt

## Setup

### 1. Clone and Install
```bash
cd hk-youth-backend
npm install
```

### 2. Create `.env` from template
```bash
cp .env.example .env
```
Then fill in your **MongoDB Atlas connection string** and a **JWT secret**:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/hk-youth?retryWrites=true&w=majority
JWT_SECRET=your_strong_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run Development Server
```bash
npm run dev
```
Server starts at `http://localhost:5000`

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/posts` | ✅ | Get feed |
| POST | `/api/posts` | ✅ | Create post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |
| POST | `/api/posts/:id/comment` | ✅ | Add comment |
| GET | `/api/events` | ✅ | Get events |
| POST | `/api/events` | Guide/Admin | Create event |
| POST | `/api/events/:id/register` | ✅ | Register/Unregister |
| GET | `/api/sadhana` | ✅ | My sadhana logs |
| POST | `/api/sadhana` | ✅ | Log today's sadhana |
| GET | `/api/chat` | ✅ | My chat threads |
| GET | `/api/chat/:threadId` | ✅ | Thread messages |
| GET | `/api/community/circles` | ✅ | All circles |
| POST | `/api/community/circles/:id/join` | ✅ | Join/Leave circle |
| GET | `/api/community/devotees` | ✅ | All devotees |
| POST | `/api/community/follow/:id` | ✅ | Follow/Unfollow |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_thread` | `threadId` | Join a chat room |
| `leave_thread` | `threadId` | Leave a chat room |
| `send_message` | `{ threadId, text }` | Send a message |
| `typing` | `{ threadId }` | Show typing indicator |
| `stop_typing` | `{ threadId }` | Hide typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_post` | post object | New post in feed |
| `post_liked` | `{ postId, likes }` | Like count updated |
| `new_comment` | `{ postId, comment }` | New comment |
| `new_event` | event object | New event created |
| `event_updated` | `{ eventId, registeredCount }` | Registration changed |
| `receive_message` | `{ threadId, message }` | New chat message |
| `user_typing` | `{ userId, name }` | Someone is typing |
| `user_stop_typing` | `{ userId }` | Stopped typing |
