# Task 2 — Project Management Tool

A full-stack Kanban project management app with drag-and-drop task management.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + @hello-pangea/dnd
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT

## Features
- Project dashboard with progress tracking
- Kanban board with drag-and-drop
- Task detail modal with inline editing
- List view with sortable table
- Team member management
- Priority and status system

## Environment Variables

### Server (.env)
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=https://your-vercel-url.vercel.app

### Client (.env)
VITE_API_URL=https://your-render-url.onrender.com

## Local Development
cd server && npm run dev
cd client && npm run dev

## Deployment
- Frontend: Vercel (root: Task-2/client, build: npm run build, output: dist)
- Backend: Render (root: Task-2/server, start: npm start)
