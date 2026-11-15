<h1 align="center">ShopIndi</h1>

<p align="center">
  <strong>A full-stack e-commerce store for the Indian market — React, Express and MongoDB.</strong><br/>
  Catalogue search and filters · stock-safe ordering · order tracking · wishlist · reviews · admin analytics
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Tests-Jest%20%2B%20Supertest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
</p>

Built for the **CodSoft Web Development Internship — Task 1**.

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

No database or configuration needed. The demo starts the API on a throw-away **in-memory MongoDB**, loads ~200 products with their reviews, and creates two weeks of sample orders so the admin dashboard has data to chart.

```bash
# Terminal 1 — API on http://localhost:5000
cd Task-1/server
npm install
npm run demo

# Terminal 2 — web app on http://localhost:5173
cd Task-1/client
npm install
npm run dev
```

`npm run demo` prints an admin login and a customer login when it starts. Everything is discarded when you stop it. (The first run downloads a MongoDB binary, so it takes a little longer.)

---

## Features

### Shopping

| Area | What it does |
|---|---|
| **Catalogue** | Search by name, brand or category; filter by category (multi-select), price range and availability; five sort orders; page-number pagination |
| **Shareable filters** | Every filter lives in the URL (`/products?category=Books&sort=price_asc`), so results can be bookmarked or shared and the back button works |
| **Product page** | Image gallery, live stock status, rating breakdown, reviews, related products from the same category |
| **Cart** | Persists across refreshes; quantities are capped by stock; prices and stock are re-checked against the server whenever the cart is opened |
| **Checkout** | Address form validated on both client and server (Indian mobile number and pincode formats); Cash on Delivery or simulated online payment |
| **Orders** | History, a detail page with a step-by-step tracking timeline, and self-service cancellation until the order ships |
| **Wishlist** | Saved to the account, so it follows the user across devices |
| **Reviews** | One per customer per product; a **Verified purchase** badge appears when the reviewer has a delivered order containing the product |
| **Account** | Register / log in, edit profile, change password; visitors are returned to the page they were on after logging in |

### Admin panel (`/admin`)

| Area | What it does |
|---|---|
| **Dashboard** | Revenue, order count, average order value; 14-day revenue trend; orders by status; sales by category; best sellers; low-stock alerts; recent orders |
| **Products** | Search, filter, paginate; create / edit / delete with validation |
| **Orders** | Filter by status; expand any order for items, address and timeline; move it along the lifecycle with one click |
| **Users** | Search accounts, see each customer's order count and lifetime spend, grant or revoke admin rights |

### Motion and interaction

Animated components adapted from **motion-ui**, **Magic UI** and **React Bits**, built on the `motion` library: a hero with a WebGL light-ray backdrop, a word-by-word headline and a floating, cursor-tilting stack of real products with scroll parallax; count-up statistics; brand and review marquees; a spotlight bento grid of categories; scroll-reveal sections; a scroll progress bar; cross-fading page changes; a navbar that hides while scrolling down; a phone bottom dock; an animated order-tracking timeline; and confetti on a placed order.

Every curve, duration and spring comes from one token file (`client/src/lib/motion.js`), the animation engine and the shader are loaded on demand, and all of it respects the system "reduce motion" setting. The full list, the rule-by-rule audit and the bundle figures are in [improvements.md](improvements.md).

### Across the app

Responsive from phone to desktop · skeleton loaders · empty and error states with retry · toast notifications · route-level code splitting · an error boundary so a rendering bug never leaves a blank page.

---

## Architecture

```
┌────────────────────────┐   HTTPS / JSON    ┌──────────────────────────────────────────────┐
│  React SPA (Vite)      │ ────────────────► │  Express API                                  │
│                        │                   │                                               │
│  pages ─► context      │ ◄──────────────── │  routes ─► validate ─► protect/authorize      │
│  (Auth, Cart,          │   { data } or     │        ─► controllers ─► Mongoose models      │
│   Wishlist, Toast)     │   { message,      │                                               │
│  lib/axios             │     errors[] }    │  every error ─► central error handler         │
└────────────────────────┘                   └──────────────────────┬───────────────────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │   MongoDB   │
                                                              └─────────────┘
```

**Request lifecycle on the server**

1. `helmet`, CORS, JSON body parser (100 kB limit), rate limiter
2. The route's **zod schema** validates and normalises `body`, `query` and `params`; unknown keys are dropped
3. `protect` verifies the JWT and loads the user from the database; `authorize('admin')` checks the role
4. The **controller** runs the business logic against the Mongoose models
5. Anything thrown — validation failure, bad ObjectId, duplicate key, expired token — is turned into one consistent JSON shape by the **central error handler**

---

## Design decisions worth explaining

**1. The server never trusts the cart.**
The client sends only `{ productId, quantity }` pairs. Names, prices, the shipping fee and the total are all computed on the server from the database. Editing the request to send `"price": 1` changes nothing — there is a test for exactly that.

**2. Overselling is prevented with an atomic conditional update.**
Stock is reserved per product with:

```js
Product.updateOne({ _id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })
```

The check and the decrement are a single database operation, so two customers buying the last unit at the same instant cannot both succeed. If a later line in the same order fails, the lines already reserved are released. This works on any MongoDB deployment — it does not need multi-document transactions or a replica set.

**3. Orders follow a state machine.**
`Pending → Processing → Shipped → Delivered`, with `Cancelled` reachable only from `Pending` or `Processing`. Invalid jumps are rejected. Each change is appended to `statusHistory`, which drives the tracking timeline. Cancelling returns the stock, and the update is guarded by the current status so a double-click cannot return it twice.

**4. Orders store a snapshot of each item.**
Name, price and image are copied into the order at purchase time. Editing or deleting a product later never rewrites past orders.

**5. Roles are read from the database, not from the token.**
The JWT carries only the user id. Each request loads the user, so promoting, demoting or deleting an account takes effect immediately rather than when the token expires.

**6. Analytics are computed by MongoDB.**
The dashboard uses aggregation pipelines (`$group`, `$unwind`, `$lookup`, `$dateToString`) run in parallel, instead of loading every order into Node.

**7. Filters live in the URL.**
The products page has no filter state of its own — it renders whatever the query string says. In-flight requests are aborted when the filters change, so a slow earlier response can never overwrite a newer one.

---

## Project structure

```
Task-1/
├── vercel.json                  # Single-project Vercel deploy (API + SPA)
├── api/index.js                 # Vercel serverless entry → server/server.js
├── server/
│   ├── server.js                # Entry: listens when run directly, exports the app for serverless/tests
│   ├── app.js                   # Express app: middleware, routes, error handling
│   ├── config/
│   │   ├── db.js                # Cached MongoDB connection
│   │   └── constants.js         # Categories, order statuses and transitions, shipping rules
│   ├── models/                  # User, Product, Order, Review
│   ├── validators/schemas.js    # zod schemas for every request
│   ├── middleware/
│   │   ├── auth.js              # protect, authorize, signToken
│   │   ├── validate.js          # runs a zod schema against the request
│   │   └── error.js             # 404 + central error handler
│   ├── controllers/             # auth, product, order, review, wishlist, admin
│   ├── routes/                  # one router per resource
│   ├── utils/                   # ApiError, asyncHandler
│   ├── scripts/
│   │   ├── demo.js              # zero-setup in-memory demo
│   │   └── makeAdmin.js         # promote an account from the command line
│   ├── seed.js                  # catalogue seeder
│   └── tests/                   # Jest + Supertest integration tests
└── client/
    └── src/
        ├── App.jsx              # Providers and routes (lazy-loaded pages)
        ├── index.css            # Design system: buttons, inputs, cards, badges
        ├── lib/                 # axios instance + error helpers, formatting helpers
        ├── hooks/               # useDebounce, usePageTitle
        ├── context/             # Auth, Cart, Wishlist
        ├── components/          # Navbar, Footer, ProductCard, ProtectedRoute, Toast, ErrorBoundary, ui
        │   └── motion/          # Animated components (Magic UI / React Bits ports) — see improvements.md
        └── pages/
            ├── Home, Products, ProductDetail, Cart, Checkout
            ├── Orders, OrderDetail, Wishlist, Profile
            ├── Login, Register, NotFound
            └── admin/           # AdminLayout, Dashboard, Products, Orders, Users
```

---

## Data model

```
User ──┬──< Order >── items[] (snapshot of Product at purchase time)
       ├──< Review >── Product
       └──  wishlist[] ──> Product
```

| Collection | Fields |
|---|---|
| **User** | `name`, `email` (unique, lower-cased), `password` (bcrypt hash, excluded from queries by default), `role` (`user` \| `admin`), `wishlist[]`, timestamps |
| **Product** | `name`, `description`, `price` (₹), `category`, `brand`, `images[]`, `stock`, `rating { average, count }`, timestamps |
| **Order** | `userId`, `items[] { productId, name, price, quantity, image }`, `shippingAddress { name, phone, address, city, state, pincode }`, `paymentMethod`, `itemsTotal`, `shippingFee`, `totalAmount`, `status`, `statusHistory[] { status, at, note }`, timestamps |
| **Review** | `productId`, `userId`, `userName`, `rating` (1–5), `comment`, `verifiedPurchase`, timestamps |

**Indexes:** unique `User.email` · `Product (category, price)`, `(rating.average, rating.count)`, `createdAt` · `Order.userId`, `status`, `createdAt` · unique `Review (productId, userId)`.

---

## API reference

Base path `/api`. Errors always look like `{ "message": "…", "errors": [{ "field": "…", "message": "…" }] }` (`errors` only for validation failures).

🔐 logged-in user · 🔑 admin

### Auth — `/api/auth`
| Method | Path | | Description |
|---|---|---|---|
| POST | `/register` | | Create an account → `{ token, user }` |
| POST | `/login` | | Log in → `{ token, user }` |
| GET | `/me` | 🔐 | Current user |
| PUT | `/me` | 🔐 | Update name |
| PUT | `/password` | 🔐 | Change password (needs the current one) |

### Products — `/api/products`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/` | | List → `{ products, total, page, pages }` |
| GET | `/meta` | | Category counts, top brands and price range |
| GET | `/:id` | | One product |
| GET | `/:id/related` | | Up to 4 products from the same category |
| POST | `/` | 🔑 | Create |
| PUT | `/:id` | 🔑 | Update (partial) |
| DELETE | `/:id` | 🔑 | Delete, along with its reviews and wishlist entries |

Query parameters for `GET /`: `q`, `category` (repeatable), `brand`, `minPrice`, `maxPrice`, `inStock=true`, `sort` (`newest` \| `top_rated` \| `price_asc` \| `price_desc` \| `name`), `page`, `limit` (max 100).

### Orders — `/api/orders`
| Method | Path | | Description |
|---|---|---|---|
| POST | `/` | 🔐 | Place an order: `{ items: [{ productId, quantity }], shippingAddress, paymentMethod }` |
| GET | `/mine` | 🔐 | My orders |
| GET | `/:id` | 🔐 | One order (owner or admin) |
| PUT | `/:id/cancel` | 🔐 | Cancel my order (before it ships) |
| GET | `/` | 🔑 | All orders; `status`, `page`, `limit` |
| PUT | `/:id/status` | 🔑 | Move to the next status |

### Reviews — `/api/reviews`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/featured` | | Recent five-star reviews with a comment (home page) |
| GET | `/:productId` | | Reviews for a product |
| POST | `/:productId` | 🔐 | Add a review `{ rating, comment }` |
| DELETE | `/:id` | 🔐 | Delete a review (author or admin) |

### Wishlist — `/api/wishlist`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/` | 🔐 | Saved products |
| POST | `/:productId` | 🔐 | Toggle a product in or out |

### Admin — `/api/admin`
| Method | Path | | Description |
|---|---|---|---|
| GET | `/stats` | 🔑 | Dashboard analytics |
| GET | `/users` | 🔑 | Accounts with order count and spend; `q`, `page`, `limit` |
| PUT | `/users/:id/role` | 🔑 | Set role to `user` or `admin` |

`GET /api/health` returns `{ status: "ok" }` for uptime checks.

---

## Ports

Both internship projects use fixed, separate ports, so they can run at the same time:

| | API | Web app |
|---|---|---|
| **Task-1 — ShopIndi** | `5000` | `5173` |
| Task-2 — TaskFlow | `5001` | `5174` |

If a port is already taken, the server or Vite stops with a message saying so, instead of starting on a different port.

---

## Running against your own database

**Prerequisites:** Node.js 18+, a MongoDB connection string (the Atlas free tier works).

```bash
cd Task-1/server
npm install
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET
npm run seed                # loads ~200 products and their reviews
npm run dev                 # http://localhost:5000

cd ../client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

| Server variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign login tokens |
| `PORT` | no | Defaults to `5000` |
| `JWT_EXPIRES_IN` | no | Defaults to `7d` |
| `CLIENT_URL` | no | Comma-separated list of allowed frontend origins; empty allows all |

| Client variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL. Optional — defaults to `http://localhost:5000/api` in development and same-origin `/api` in production |

> `npm run seed` **replaces** the `products` and `reviews` collections. Users and orders are left alone.

**Creating an admin.** Register normally in the app, then:

```bash
cd Task-1/server
npm run make-admin -- you@example.com
```

After that, further admins can be promoted from **Admin → Users**.

| Server script | Does |
|---|---|
| `npm run dev` | API with auto-reload |
| `npm start` | API (production) |
| `npm run demo` | API on an in-memory database with sample data |
| `npm run seed` | Load the catalogue |
| `npm run make-admin -- <email>` | Promote an account |
| `npm test` | Run the test suite |

---

## Testing

```bash
cd Task-1/server
npm test
```

48 integration tests drive the real Express app through Supertest against an in-memory MongoDB, so they need no setup and never touch a real database. They cover:

- **Auth** — registration rules, duplicate emails, identical errors for wrong password and unknown email, operator-injection attempts, token handling, password change
- **Products** — search, filters, sorting, pagination, input validation, admin-only writes, partial updates, cascade on delete
- **Orders** — server-side pricing, shipping fee, tampered prices ignored, overselling refused with stock rolled back, **two concurrent buyers for the last unit**, ownership, cancellation restoring stock exactly once, the status state machine, dashboard figures
- **Reviews, wishlist, admin users** — one review per user, rating recalculation, verified-purchase badge, role changes

---

## Deployment

**Vercel, single project (recommended).** The React build is served as static files and the Express app runs as one serverless function (`api/index.js` → `server/server.js`) behind `/api/*`, so the frontend calls `/api` on its own domain — no `VITE_API_URL`, no CORS setup.

1. On Vercel, **Add New → Project**, import this repository and set **Root Directory** to `Task-1`.
2. **Framework Preset:** *Other*. Leave Build / Output / Install commands at their defaults — `vercel.json` sets them (installs `server` and `client`, builds `client`, serves `client/dist`).
3. **Environment variables** (Production and Preview):

   | Name | Value |
   |---|---|
   | `MONGO_URI` | Atlas connection string, including the database name |
   | `JWT_SECRET` | A long random string (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `JWT_EXPIRES_IN` | Optional, default `7d` |

   Do **not** set `VITE_API_URL` or `CLIENT_URL` for this setup.
4. **Deploy**, then open `https://<project>.vercel.app/api/health` — it should return `{"status":"ok",…}`.

Or from the CLI: `cd Task-1 && vercel` (link a new project, accept the detected settings), add the variables with `vercel env add MONGO_URI` and `vercel env add JWT_SECRET`, then `vercel --prod`.

**Seed data and admin.** With the Atlas `MONGO_URI` in `server/.env`, run `npm run seed` from `server/` to load the catalogue; register on the live site, then run `npm run make-admin -- you@example.com`.

**Database.** In MongoDB Atlas create a free cluster and a database user, and under **Network Access** allow `0.0.0.0/0` — Vercel functions do not have fixed IP addresses.

**Split (API elsewhere, e.g. Render).**

| Part | Settings |
|---|---|
| API | Root `Task-1/server` · build `npm install` · start `npm start` · env `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=<frontend URL>` |
| Frontend | Root `Task-1/client` · build `npm run build` · output `dist` · env `VITE_API_URL=<API URL>/api` |

---

## Security

| Concern | How it is handled |
|---|---|
| Passwords | bcrypt (10 rounds); minimum 8 characters with a letter and a number; the hash is never returned by any query unless explicitly selected |
| Sessions | JWT in the `Authorization` header, 7-day expiry; the user is re-loaded on every request |
| Authorisation | `protect` + `authorize('admin')` on the server; customers can only read and cancel their own orders. Client-side route guards are a convenience only |
| Input validation | zod schema on every write and every query string; unknown fields are stripped, so `role` cannot be set at registration and `price` cannot be sent with an order |
| NoSQL injection | Schemas require plain strings/numbers, so payloads like `{ "email": { "$ne": null } }` are rejected; search text is escaped before being used in a regular expression |
| Brute force | 20 auth attempts per 15 minutes per IP; 600 requests per 15 minutes for the API overall |
| Enumeration | Login returns the same error for an unknown email and a wrong password |
| Headers / payloads | `helmet` security headers; 100 kB JSON body limit; image URLs must be `http(s)` |
| Error output | Internal error details are logged on the server and not sent to clients in production |
| Secrets | Read from environment variables; `.env` files are git-ignored |

---

## Known limitations

- **Payments are simulated.** "Pay online" records the choice but charges nothing; there is no payment gateway integration.
- **The token is kept in `localStorage`**, which is readable by any script on the page. An `httpOnly` cookie with CSRF protection would be the stronger choice for production.
- **Product images are URLs.** There is no file upload.
- **The cart is stored in the browser**, not on the account, so it does not follow the user to another device (the wishlist does).
- **Rate limiting is in-memory**, so on serverless platforms each instance counts separately.
- **No email** — there is no address verification or password reset flow.

---

<p align="center">CodSoft Web Development Internship · Task 1</p>
