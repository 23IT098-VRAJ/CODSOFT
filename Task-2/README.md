<h1 align="center">TaskFlow — Project Management Tool</h1>

<p align="center">
  <strong>A full-stack Kanban project management app — React, Express and MongoDB.</strong><br/>
  Drag-and-drop boards · team membership · comments · activity feed · project statistics
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/React%2019-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Tests-Jest%20%2B%20Supertest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
</p>

Built for the **CodSoft Web Development Internship — Task 2**.

---

## Contents

- [Try it in one minute](#try-it-in-one-minute)
- [Features](#features)
- [Architecture](#architecture)
- [Design decisions worth explaining](#design-decisions-worth-explaining)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Running against your own database](#running-against-your-own-database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Known limitations](#known-limitations)

---

## Try it in one minute

No database or configuration needed. The demo starts the API on a throw-away **in-memory MongoDB** with a three-person team, three projects, tasks, comments and an activity history.

```bash
# Terminal 1 — API on http://localhost:5001
cd Task-2/server
npm install
npm run demo

# Terminal 2 — web app on http://localhost:5174
cd Task-2/client
npm install
npm run dev
```

`npm run demo` prints the three demo logins when it starts. Everything is discarded when you stop it. (The first run downloads a MongoDB binary, so it takes a little longer.)

---

## Features

| Area | What it does |
|---|---|
| **Accounts** | Register and log in; rename yourself and change your password on the profile page |
| **Dashboard** | A personal summary — my open tasks, what is overdue, what is due this week, recent team activity — and a searchable, filterable grid of projects with live progress |
| **My tasks** | Everything assigned to me across all projects, split into Open, Overdue and Done |
| **Kanban board** | To Do · In Progress · Done with drag-and-drop between and within columns (mouse, touch or keyboard); positions are kept gap-free on screen and on the server |
| **List view** | The same tasks as a table, sortable by any column |
| **Overview** | A project report: completion ring, tasks by status, open tasks by priority, overdue / unassigned / done-this-week figures, each member's workload, and the activity feed |
| **Task details** | A side panel to edit title, description, status, priority, assignee and due date, with a comment thread underneath; it has its own link (`?task=…`) |
| **Filters** | Search tasks and filter by priority, assignee and overdue |
| **Team** | Invite a registered user by email, remove a member (owner) or leave a project (member); their tasks become unassigned |
| **Project settings** | Name, description, colour, status and due date; the owner can delete the project |
| **Activity feed** | Who created, moved, assigned, completed or commented on what, per project and across projects |

Throughout: loading skeletons, empty and error states with retry, toast messages, confirmation dialogs for destructive actions, and motion that follows one set of rules (see [improvements.md](improvements.md)).

---

## Architecture

```
┌────────────────────────┐   HTTPS / JSON    ┌──────────────────────────────────────────────┐
│  React SPA (Vite)      │ ────────────────► │  Express 5 API                                │
│                        │                   │                                               │
│  pages ─► AuthContext  │ ◄──────────────── │  routes ─► validate ─► protect ─► access      │
│  lib/axios             │  data, or         │        ─► controllers ─► services ─► models   │
│  @hello-pangea/dnd     │  { message,       │                                               │
│                        │    errors[] }     │  every error ─► central error handler         │
└────────────────────────┘                   └──────────────────────┬───────────────────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │   MongoDB   │
                                                              └─────────────┘
```

**Request lifecycle on the server**

1. `helmet`, CORS allow-list, JSON body parser (100 kB limit), rate limiter
2. The route's **zod schema** validates and normalises `body`, `query` and `params`; unknown keys are dropped
3. `protect` verifies the JWT and loads the user from the database
4. The **access middleware** loads the project (or the task and its project) and checks that the user is a member
5. The **controller** does the work, using a **service** for board ordering
6. Anything thrown is turned into one consistent JSON shape by the **central error handler**

---

## Design decisions worth explaining

**1. Membership is checked in one place.**
`middleware/access.js` loads the project for every project and task route and refuses anyone who is not a member. Controllers receive `req.project` and `req.task` already authorised, so no controller can forget the check.

**2. A column's order is always 0, 1, 2 … with no gaps or duplicates.**
Dropping a task at position 1 used to set *its* order to 1 and leave the task already at 1 untouched, so the two tied and the column's order became arbitrary. `services/taskOrder.js` now inserts the task at the drop position, shifts the tasks after it, and closes the gap in the column it left — in a single bulk write. Deleting a task or changing its status from the edit form keeps the same rule.

**3. A task can only be assigned to a project member.**
Assigning to anyone else is rejected. When a member is removed or leaves, their tasks stay in the project and become unassigned.

**4. The client cannot set what it should not.**
Validation drops unknown fields, so a request cannot change a project's `ownerId` or `members`, or a task's `projectId` or `createdBy`, through an update.

**5. Dashboard counts come from one aggregation.**
The project list used to run two count queries per project. It now runs one `$group` over all of the user's projects, and adds an overdue count.

**6. The activity feed can never break a request.**
Writing a feed entry is wrapped so that a failure is logged and ignored — the task still moves. Each entry stores a small snapshot (task title, from/to status), so it still reads correctly after the task is deleted.

**7. The app is exported, not just started.**
`app.js` builds the Express app; `server.js` listens only when run directly. Tests and serverless platforms import the app without opening a port, and a database outage returns a clear `503` instead of exiting the process.

**8. A failed login is a `400`, on purpose.**
`401` would be more conventional, but the web client treats every `401` as "session expired" and reloads the login page, which would wipe the error message before it could be read. The reason is documented at the code and pinned by a test.

---

## Project structure

```
Task-2/
├── vercel.json                    # Single-project Vercel deploy (API + SPA)
├── improvements.md                # What changed in the frontend, and the motion audit
├── client/                        # React (Vite) frontend
│   └── src/
│       ├── App.jsx                # Providers, lazy routes, route guard
│       ├── index.css              # Design system: buttons, inputs, cards, badges
│       ├── context/AuthContext.jsx
│       ├── lib/                   # axios (token, session expiry, error helpers), format, motion tokens
│       ├── components/
│       │   ├── AppShell.jsx       # Top bar and account menu
│       │   ├── AuthLayout.jsx     # Sign-in frame with the animated board preview
│       │   ├── ui.jsx             # Avatar, Badge, Tabs, Modal, Drawer, ConfirmDialog, ProgressRing…
│       │   ├── motion.jsx         # Reveal, CountUp, IconSwap, PageTransition
│       │   ├── Toast.jsx, ProjectCard.jsx, ActivityFeed.jsx
│       │   └── board/             # BoardView, ListView, Overview, TaskDrawer, MembersModal
│       └── pages/                 # Login, Register, Dashboard, MyTasks, ProjectBoard, ProjectForm, Profile, NotFound
└── server/
    ├── server.js                  # Entry: listens when run directly, exports the app otherwise
    ├── app.js                     # Express app: middleware, routes, error handling
    ├── render.yaml                # Render deployment config
    ├── config/
    │   ├── db.js                  # Cached MongoDB connection
    │   └── constants.js           # Statuses, priorities, activity types
    ├── models/                    # User, Project, Task, Comment, Activity
    ├── validators/schemas.js      # zod schemas for every request
    ├── middleware/
    │   ├── auth.js                # protect, signToken
    │   ├── access.js              # loadProject, loadTask, requireOwner
    │   ├── validate.js            # runs a zod schema against the request
    │   └── error.js               # 404 + central error handler
    ├── services/taskOrder.js      # Keeps Kanban columns in order
    ├── controllers/               # auth, project, task (+ comments), dashboard
    ├── routes/                    # auth, projects, tasks
    ├── utils/ApiError.js
    ├── scripts/demo.js            # Zero-setup in-memory demo
    └── tests/                     # Jest + Supertest integration tests
```

---

## Data model

```
User ──< Project (owner)            Project >──< User (members)
Project ──< Task ──< Comment        Project ──< Activity
Task >── User (assignee)
```

| Collection | Fields |
|---|---|
| **User** | `name`, `email` (unique, lower-cased), `password` (bcrypt hash, excluded from queries by default), `avatarColor`, timestamps |
| **Project** | `name`, `description`, `color`, `ownerId`, `members[]` (always includes the owner), `status` (`Active` \| `Completed` \| `On Hold`), `dueDate`, timestamps |
| **Task** | `projectId`, `title`, `description`, `status` (`Todo` \| `In Progress` \| `Done`), `priority` (`Low` \| `Medium` \| `High`), `assigneeId`, `dueDate`, `order`, `createdBy`, `completedAt`, timestamps |
| **Comment** | `taskId`, `projectId`, `authorId`, `body`, timestamps |
| **Activity** | `projectId`, `actorId`, `type`, `taskId`, `meta`, `createdAt` |

**Indexes:** unique `User.email` · `Project.members` · `Task (projectId, status, order)` and `(assigneeId, status)` · `Comment.taskId`, `Comment.projectId` · `Activity (projectId, createdAt)`.

---

## API reference

Base path `/api`. Every route except register, login and health needs `Authorization: Bearer <token>`.
Errors look like `{ "message": "…", "errors": [{ "field": "…", "message": "…" }] }` (`errors` only for validation failures).

👥 project member · 👑 project owner

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create an account → `{ token, user }` |
| POST | `/login` | Log in → `{ token, user }` |
| GET | `/me` | Current user |
| PUT | `/me` | Update name |
| PUT | `/password` | Change password (needs the current one) |

### Projects — `/api/projects`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/` | | My projects, each with `taskStats { done, total, overdue }`. Filters: `status`, `q` |
| POST | `/` | | Create a project; the creator becomes owner and first member |
| GET | `/:id` | 👥 | One project with its members |
| PUT | `/:id` | 👥 | Update name, description, colour, status, due date (partial) |
| DELETE | `/:id` | 👑 | Delete the project and its tasks, comments and activity |
| POST | `/:id/members` | 👥 | Add a registered user by `{ email }` |
| DELETE | `/:id/members/:userId` | 👑 / self | Remove a member, or leave the project |
| GET | `/:id/stats` | 👥 | Project statistics |
| GET | `/:id/activity` | 👥 | Activity feed, newest first; `limit` (max 100) |

### Tasks — `/api/tasks`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/mine` | | Tasks assigned to me across all projects; `status`, `overdue` |
| GET | `/:projectId` | 👥 | A project's tasks in board order. Filters: `status`, `priority`, `assignee` (`me` \| `none` \| id), `overdue=true`, `q` |
| POST | `/` | 👥 | Create a task: `{ projectId, title, status?, priority?, assigneeId?, dueDate?, description? }` |
| PUT | `/:id` | 👥 | Edit a task (partial). Changing `status` moves it to the end of the new column |
| PATCH | `/:id/move` | 👥 | Drag and drop: `{ status, order }` where `order` is the position in the column |
| DELETE | `/:id` | 👥 | Delete a task and its comments |
| GET | `/:id/comments` | 👥 | Comments, oldest first |
| POST | `/:id/comments` | 👥 | Add a comment `{ body }` |
| DELETE | `/:id/comments/:commentId` | author / 👑 | Delete a comment |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | My projects by status, my tasks by status, overdue count, tasks due in 7 days, recent activity |
| GET | `/api/health` | `{ status: "ok" }` — no authentication |

---

## Ports

Both internship projects use fixed, separate ports, so they can run at the same time:

| | API | Web app |
|---|---|---|
| Task-1 — ShopIndi | `5000` | `5173` |
| **Task-2 — TaskFlow** | `5001` | `5174` |

If a port is already taken, the server or Vite stops with a message saying so, instead of starting on a different port. To change Task-2's API port, update `PORT` in `server/.env` **and** `API_PORT` in `client/vite.config.js`; to change the web port, update `client/vite.config.js` **and** `CLIENT_URL` in `server/.env`.

---

## Running against your own database

**Prerequisites:** Node.js 18+, a MongoDB connection string (the Atlas free tier works).

```bash
cd Task-2/server
npm install
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm run dev                 # http://localhost:5001

cd ../client
npm install
npm run dev                 # http://localhost:5174
```

| Server variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign login tokens |
| `CLIENT_URL` | in production | Comma-separated list of frontends allowed to call the API. Defaults to `http://localhost:5174` |
| `PORT` | no | Defaults to `5001` |
| `JWT_EXPIRES_IN` | no | Defaults to `7d` |

| Client variable | Purpose |
|---|---|
| `VITE_API_URL` | The API's **origin, without `/api`** — the client adds `/api/...` itself. Leave it empty for local development: Vite proxies `/api` to `localhost:5001`. |

| Server script | Does |
|---|---|
| `npm run dev` | API with auto-reload |
| `npm start` | API (production) |
| `npm run demo` | API on an in-memory database with sample data |
| `npm test` | Run the test suite |

---

## Testing

```bash
cd Task-2/server
npm test
```

41 integration tests drive the real Express app through Supertest against an in-memory MongoDB, so they need no setup and never touch a real database. They cover:

- **Auth** — the exact response shape the web client expects, duplicate emails, validation, identical errors for wrong password and unknown email, operator-injection attempts, token handling, profile and password changes
- **Projects** — creation and auto-membership, the empty due date the web form sends, validation, statistics on the list, access for members / outsiders / owner, protection of `ownerId` and `members`, cascade on delete, adding / removing / leaving, the stats report and the activity feed
- **Tasks** — creation and ordering, validation, outsiders blocked on every operation, assignee must be a member, the task form exactly as the client sends it, **reordering within a column, moving between columns, clamping, gap closing**, completion timestamps, filters, "my tasks", comments and their permissions, the personal dashboard

---

## Deployment

**Split: Render (API) + Vercel (frontend).**

| Part | Settings |
|---|---|
| API | Root `Task-2/server` · build `npm install` · start `npm start` · env `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=<frontend URL>`. `server/render.yaml` describes this service. |
| Frontend | Root `Task-2/client` · build `npm run build` · output `dist` · env `VITE_API_URL=<API origin, no /api>` |

**Vercel, single project.** Import the repository with **Root Directory** set to `Task-2`. `vercel.json` builds the client as a static site and runs `server/server.js` as a serverless function behind `/api/*`. Set `MONGO_URI` and `JWT_SECRET`; leave `VITE_API_URL` empty so the frontend calls same-origin `/api`.

**Database.** Create a free MongoDB Atlas cluster, add a database user, allow the host's IP addresses, and copy the connection string into `MONGO_URI`.

---

## Security

| Concern | How it is handled |
|---|---|
| Passwords | bcrypt (10 rounds); the hash is never returned by any query unless explicitly selected |
| Sessions | JWT in the `Authorization` header, 7-day expiry; the user is re-loaded on every request, so a deleted account stops working at once |
| Authorisation | One access middleware for every project and task route; owner-only actions checked separately |
| Input validation | zod schema on every body, query string and URL parameter; unknown fields are stripped |
| NoSQL injection | Schemas require plain strings, so payloads like `{ "email": { "$ne": null } }` are rejected; search text is escaped before use in a regular expression |
| Brute force | 20 auth attempts per 15 minutes per IP; 1000 requests per 15 minutes for the API overall |
| Enumeration | Login returns the same error for an unknown email and a wrong password |
| Headers / payloads | `helmet` security headers; 100 kB JSON body limit; project colour must be a hex value |
| CORS | Explicit allow-list from `CLIENT_URL` |
| Error output | Malformed ids and invalid values return `400`, not `500`; internal error details are not sent to clients in production |
| Secrets | Read from environment variables; `.env` files are git-ignored |

---

## Known limitations

- **Adding a member reveals whether an email is registered.** Inviting by email needs that answer; it is limited to people who are already members of the project.
- **Two people dragging in the same column at the same instant** can leave a duplicate position. It is corrected by the next move in that column; a transaction would remove the window entirely.
- **The token is kept in `localStorage`**, readable by any script on the page. An `httpOnly` cookie with CSRF protection would be stronger.
- **No real-time updates** — another member's changes appear after a refresh.
- **Rate limiting is in-memory**, so on serverless platforms each instance counts separately.
- **No email** — no address verification, invitations or password reset.

---

<p align="center">CodSoft Web Development Internship · Task 2</p>
