# ShopIndi — Full-Stack E-Commerce Platform

ShopIndi is a modern full-stack e-commerce platform built with Node.js/Express on the backend and React/Vite/Tailwind on the frontend. It features user authentication, product browsing with filters, a shopping cart, checkout flow, order tracking, and a full admin panel for managing products and orders.

## Setup

### Backend
```bash
cd server && npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
node seed.js           # seed 20 products
npm run dev            # nodemon server.js
```

### Frontend
```bash
cd client && npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev
```

## Deploy
- Frontend: Vercel (set VITE_API_URL to Render backend URL)
- Backend: Render (set env vars MONGO_URI, JWT_SECRET, PORT)
- MongoDB: MongoDB Atlas free tier

## Default Admin
Manually set role:"admin" on a registered user in MongoDB Atlas → Users collection.
