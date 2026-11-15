<h1 align="center">
  📋 TaskFlow — Project Management Tool
</h1>

<p align="center">
  <strong>A production-ready, full-stack Kanban project management application.</strong><br/>
  Drag-and-drop task boards · Team collaboration · Progress tracking · Priority system
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render"/>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Security](#-security)

---

## 🌟 Overview

**TaskFlow** (CodSoft Internship — Task 2) is a collaborative project management tool inspired by tools like Trello and Linear. It allows teams to organize work into projects, manage tasks on an interactive **Kanban board** with drag-and-drop support, track progress visually, and collaborate with team members — all secured behind JWT authentication.

Key engineering highlights:
- **Drag-and-drop** powered by `@hello-pangea/dnd` with server-persisted task order
- **Membership-based access control** — only project members can view or modify project data
- **Optimistic UI updates** for a smooth, responsive feel
- **Compound index** on `{ projectId, status, order }` for fast Kanban queries

---

## 🚀 Live Demo

> **Frontend (Vercel):** _Add your Vercel URL here_
>
> **Backend API (Render):** _Add your Render URL here_

---

## ✨ Features

### 👤 Authentication
| Feature | Details |
|---|---|
| **Register** | Name, email, password (min 6 chars); auto-assigned avatar color from a curated palette |
| **Login** | JWT issued on success; stored in `localStorage` |
| **Protected Routes** | `ProtectedRoute` component redirects unauthenticated users to `/login` |
| **Auto-redirect** | Root `/` redirects authenticated users to `/dashboard`, guests to `/login` |

### 📊 Dashboard
| Feature | Details |
|---|---|
| **Project Cards** | Each project card shows name, description, color tag, status badge, due date, member avatars |
| **Progress Bar** | Live task completion bar — `done / total` tasks per project |
| **Status Filter** | Visual status: Active / On Hold / Completed |
| **Quick Actions** | Create new project; navigate directly to any board |

### 🗂️ Project Board
| Feature | Details |
|---|---|
| **Kanban View** | Three columns: **To Do · In Progress · Done** |
| **Drag & Drop** | Drag tasks between columns or reorder within a column; persisted to backend via `PATCH /api/tasks/:id/move` |
| **List View** | Sortable table view of all tasks with priority, assignee, and due date |
| **Task Detail Modal** | Inline editing of title, description, status, priority, assignee, and due date |
| **Task Creation** | Quick-add card at the top of each column |
| **Priority Badges** | Color-coded: 🔴 High · 🟡 Medium · 🟢 Low |

### 👥 Team Management
| Feature | Details |
|---|---|
| **Invite by Email** | Add a registered user to a project by their email address |
| **Member Avatars** | Color-coded avatar initials generated from `avatarColor` field |
| **Owner Controls** | Only the project owner can delete a project; all members can edit tasks |
| **Auto-membership** | Project creator is automatically added to the `members` array on creation |

### ⚙️ Project Settings
- Edit project name, description, color, status, and due date
- Delete project (owner only) — cascades to delete all associated tasks

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | latest | HTTP server & routing |
| `mongoose` | latest | MongoDB ODM |
| `bcryptjs` | latest | Password hashing (salt rounds: 10) |
| `jsonwebtoken` | latest | JWT authentication |
| `cors` | latest | Cross-origin resource sharing with multi-origin support |
| `dotenv` | latest | Environment variable loading |
| `nodemon` | latest | Dev auto-reload |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | 18 | UI framework |
| `react-router-dom` | ^7.17.0 | Client-side routing |
| `@hello-pangea/dnd` | ^18.0.1 | Accessible drag-and-drop |
| `axios` | ^1.17.0 | HTTP client |
| `typescript` | ~6.0.2 | Static typing |
| `vite` | ^8.0.12 | Build tool & dev server |
| `tailwindcss` | ^3.4.19 | Utility-first CSS |

---

## 📁 Project Structure

```
Task-2/
├── client/                        # React (Vite + TypeScript) frontend
│   ├── .env
│   ├── index.html
│   ├── vite.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vercel.json                # Client-side SPA routing config
│   └── src/
│       ├── main.jsx               # App entry point
│       ├── App.jsx                # Router & AuthProvider wrapper
│       ├── index.css
│       ├── style.css
│       ├── context/
│       │   └── AuthContext.jsx    # Auth state + login/logout helpers
│       ├── lib/                   # Axios instance / API helpers
│       ├── components/            # Reusable UI components
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx      # Project list with progress bars
│           ├── CreateProject.jsx
│           ├── EditProject.jsx
│           └── ProjectBoard.jsx   # Kanban + List views + drag-and-drop
└── server/                        # Node.js / Express REST API
    ├── .env
    ├── server.js                  # App entry point
    ├── render.yaml                # Render.com deployment config
    ├── middleware/
    │   └── auth.js                # JWT protect middleware
    ├── models/
    │   ├── User.js                # Avatar color, bcrypt hooks
    │   ├── Project.js             # Owner auto-membership pre-save hook
    │   └── Task.js                # Compound index, updatedAt hook
    └── routes/
        ├── auth.js                # Register + Login
        ├── projects.js            # CRUD + member management
        └── tasks.js               # CRUD + Kanban move endpoint
```

---

## 🗄️ Database Schema

### User
```js
{
  name:        String   (required, trimmed),
  email:       String   (required, unique, lowercased),
  password:    String   (bcrypt hashed, min 6 chars),
  avatarColor: String   (hex color, randomly assigned from palette),
  createdAt:   Date
}
// Hooks:
// - pre('save'): bcrypt hash if password modified
// - toJSON: strips password field from all responses
// - instance method: comparePassword(candidatePassword)
```

### Project
```js
{
  name:        String   (required, trimmed),
  description: String,
  color:       String   (hex, default: '#6366f1'),
  ownerId:     ObjectId → User  (required),
  members:     [ObjectId → User],
  status:      "Active" | "Completed" | "On Hold"  (default: "Active"),
  dueDate:     Date,
  createdAt:   Date
}
// Hooks:
// - pre('save'): auto-adds ownerId to members array on project creation
```

### Task
```js
{
  projectId:  ObjectId → Project  (required),
  title:      String   (required, trimmed),
  description: String,
  status:     "Todo" | "In Progress" | "Done"  (default: "Todo"),
  priority:   "Low" | "Medium" | "High"        (default: "Medium"),
  assigneeId: ObjectId → User  (nullable),
  dueDate:    Date,
  order:      Number   (position within status column),
  createdAt:  Date,
  updatedAt:  Date
}
// Hooks:
// - pre('save'): updates updatedAt on every save
// Indexes:
// - Compound: { projectId: 1, status: 1, order: 1 }  → fast Kanban queries
```

---

## 📡 API Reference

All routes are prefixed with `/api`. All protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Create account; returns JWT + user (no password) |
| `POST` | `/login` | ❌ | Login; returns JWT + user (no password) |

**Register/Login Request Body:**
```json
{
  "name": "Vraj Patel",
  "email": "vraj@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "_id": "...", "name": "Vraj Patel", "email": "vraj@example.com", "avatarColor": "#3730A3" }
}
```

### Projects — `/api/projects`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | 🔐 | Get all projects where user is owner or member (includes `taskStats`) |
| `POST` | `/` | 🔐 | Create a new project |
| `GET` | `/:id` | 🔐 Member | Get single project (403 if not a member) |
| `PUT` | `/:id` | 🔐 Member | Update project fields (partial update supported) |
| `DELETE` | `/:id` | 🔐 Owner | Delete project + all its tasks |
| `POST` | `/:id/members` | 🔐 Member | Add a new member by email |

**`GET /api/projects` Response includes `taskStats`:**
```json
{
  "_id": "...",
  "name": "My Project",
  "taskStats": { "done": 3, "total": 10 }
}
```

**`POST /api/projects` Request Body:**
```json
{
  "name": "My Project",
  "description": "Optional description",
  "color": "#6366f1",
  "status": "Active",
  "dueDate": "2026-12-31"
}
```

**`POST /api/projects/:id/members` Request Body:**
```json
{ "email": "teammate@example.com" }
```

### Tasks — `/api/tasks`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/:projectId` | 🔐 Member | Get all tasks for a project, sorted by `order` |
| `POST` | `/` | 🔐 Member | Create a task (auto-assigns `order` as max + 1 in status bucket) |
| `PUT` | `/:id` | 🔐 Member | Update task fields (partial update) |
| `DELETE` | `/:id` | 🔐 Member | Delete a task |
| `PATCH` | `/:id/move` | 🔐 Member | Move task to a new status/order (Kanban drag-drop) |

**`POST /api/tasks` Request Body:**
```json
{
  "title": "Design login screen",
  "projectId": "...",
  "status": "Todo",
  "priority": "High",
  "assigneeId": "...",
  "dueDate": "2026-08-01",
  "description": "Include OAuth options"
}
```

**`PATCH /api/tasks/:id/move` Request Body:**
```json
{ "status": "In Progress", "order": 2 }
```

### Health Check
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Returns `{ status: "ok", timestamp: "..." }` |

> 🔐 = Requires valid JWT of a project member/owner

---

## 🔐 Environment Variables

### Server — `server/.env`
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
PORT=5000
CLIENT_URL=http://localhost:5173
# For production, CLIENT_URL can be a comma-separated list:
# CLIENT_URL=https://your-app.vercel.app,https://custom-domain.com
```

### Client — `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```
> For production, set `VITE_API_URL` to your deployed backend URL (e.g., `https://task2-pm-api.onrender.com/api`).

---

## 💻 Local Development

**Prerequisites:** Node.js ≥ 18, npm ≥ 9, a MongoDB Atlas cluster (free M0 tier works).

### 1. Clone & Install Dependencies

```bash
# Backend
cd Task-2/server
npm install
cp .env .env.backup   # (optional backup)
# Edit .env — fill in MONGO_URI and JWT_SECRET

# Frontend
cd ../client
npm install
# Edit .env — confirm VITE_API_URL=http://localhost:5000/api
```

### 2. Start the Development Servers

Open **two terminals** simultaneously:

```bash
# Terminal 1 — Backend API (runs on http://localhost:5000)
cd Task-2/server
npm run dev

# Terminal 2 — Frontend (runs on http://localhost:5173)
cd Task-2/client
npm run dev
```

### 3. Verify the Backend

Test the health endpoint before opening the app:
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"2026-..."}
```

### 4. Open the App

Navigate to **http://localhost:5173** — you'll be redirected to `/login`.

### Typical Development Workflow

```
Register account → Create a project → Add tasks → 
Drag tasks between columns → Invite a teammate by email
```

---

## 🚀 Deployment

### Backend — Render.com

A `render.yaml` is included in `Task-2/server/` for one-click Render deployment.

**Manual setup:**
1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set **Root Directory** → `Task-2/server`
4. Set **Build Command** → `npm install`
5. Set **Start Command** → `npm start`
6. Add Environment Variables:
   ```
   MONGO_URI   = <your Atlas URI>
   JWT_SECRET  = <your secret>
   CLIENT_URL  = https://<your-vercel-app>.vercel.app
   PORT        = 10000
   ```

### Frontend — Vercel

1. Import your GitHub repo in Vercel
2. Set **Root Directory** → `Task-2/client`
3. Set **Build Command** → `npm run build` *(runs `tsc && vite build`)*
4. Set **Output Directory** → `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL = https://<your-render-app>.onrender.com/api
   ```
6. The `client/vercel.json` ensures SPA routing works for client-side navigation.

### Database — MongoDB Atlas

1. Create a free **M0 cluster** at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user (username + password)
3. Whitelist Render's IP or use `0.0.0.0/0` for development
4. Copy the connection string into `MONGO_URI`

---

## 🔒 Security

| Concern | Implementation |
|---|---|
| **Password Storage** | `bcryptjs` with 10 salt rounds via a Mongoose `pre('save')` hook |
| **Password Exposure** | `toJSON` transform on `UserSchema` strips `password` from all API responses |
| **Authentication** | Stateless JWT signed with `JWT_SECRET`; verified via `protect` middleware |
| **Authorization** | Every project/task route calls `verifyMembership()` — ensures the requesting user is an owner or member before proceeding |
| **Owner-only Actions** | Project deletion is guarded by `project.ownerId === req.user._id` |
| **CORS** | Explicit `origin` whitelist via `CLIENT_URL` env var; `credentials: true` |
| **Input Validation** | Required fields enforced at schema level (`required: true`); empty title/projectId returns 400 |
| **Error Handling** | All async routes wrapped in `try/catch`; errors return structured `{ message }` JSON |
| **Secrets** | All secrets in `.env` — `.gitignore` excludes `.env` files |

---

## 📄 License

This project was built as part of the **CodSoft Web Development Internship — Task 2**.

---

<p align="center">Made with ❤️ during CodSoft Internship · 2026</p>
