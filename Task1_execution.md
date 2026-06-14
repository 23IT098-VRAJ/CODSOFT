# E-Commerce Agent Prompts — Antigravity IDE × Sonnet 4.6

> **Rules of thumb before running each prompt:**
> - Each prompt = one focused GitHub commit. Do not merge prompts.
> - Feed the prompt exactly as written; add your current file tree as context if the IDE supports it.
> - Token budget: each prompt targets ~400–600 lines of generated code — safe for Sonnet 4.6's output window.
> - Commit message is embedded in every prompt. Use it verbatim.

---

## PHASE 1 — PROJECT SCAFFOLD

---

### 🔖 Commit 1 — `chore: init monorepo, backend scaffold, env config`

```
You are scaffolding a full-stack e-commerce project.

Create the following folder/file structure exactly:

/server
  server.js
  .env.example
  package.json       ← dependencies: express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv, cloudinary (list only, do not install)

/client              ← leave empty for now (Vite will be added later)

README.md            ← one-paragraph project summary

In server/server.js:
- Import express, cors, dotenv, mongoose
- Load .env with dotenv.config()
- Mount CORS (allow all origins for dev)
- Add express.json() middleware
- Connect mongoose to process.env.MONGO_URI with a console.log on success/failure
- Mount placeholder routers: /api/auth, /api/products, /api/orders, /api/reviews  (just express.Router() stubs for now)
- Listen on process.env.PORT || 5000

In .env.example:
MONGO_URI=
JWT_SECRET=
PORT=5000
CLOUDINARY_URL=

Keep server.js under 60 lines. No actual route logic yet.
```

---

### 🔖 Commit 2 — `feat(models): User, Product, Order, Review mongoose schemas`

```
The backend scaffold exists at /server/server.js.

Create four Mongoose models inside /server/models/:

User.js
  Fields: name, email (unique), password, role (enum: user|admin, default: user), createdAt (default: Date.now)
  Export the model.

Product.js
  Fields: name, description, price (Number), category, brand, images ([String]),
  stock (Number, default 0), rating: { average: Number default 0, count: Number default 0 }, createdAt
  Export the model.

Order.js
  Fields: userId (ref: User), 
  items: [{ productId, name, price, quantity, image }],
  shippingAddress: { name, phone, address, city, pincode },
  paymentMethod (enum: COD|CARD),
  totalAmount (Number), 
  status (enum: Pending|Processing|Delivered, default: Pending),
  createdAt (default: Date.now)
  Export the model.

Review.js
  Fields: productId (ref: Product), userId (ref: User), userName (String),
  rating (Number, min 1 max 5), comment, createdAt (default: Date.now)
  Export the model.

Rules:
- Use mongoose.Schema + mongoose.model pattern
- No virtual fields or complex hooks needed
- Keep each file under 40 lines
```

---

### 🔖 Commit 3 — `feat(auth): register, login routes + auth/admin middleware`

```
Models exist at /server/models/. Server mounts /api/auth.

Create:

/server/middleware/auth.js
  - Import jsonwebtoken, User model
  - Export authMiddleware: extract Bearer token from Authorization header,
    verify with JWT_SECRET, attach decoded payload to req.user, call next()
  - On failure: 401 { message: "Unauthorized" }

/server/middleware/admin.js
  - Import authMiddleware
  - Export adminMiddleware: run authMiddleware first (call it manually or chain),
    then check req.user.role === "admin"
  - On failure: 403 { message: "Forbidden" }

/server/routes/auth.js
  POST /register
    - Validate name, email, password present
    - Check if email already exists → 400 "Email already in use"
    - bcryptjs hash password (salt 10)
    - Save new User
    - Sign JWT { _id, name, role } with JWT_SECRET, expiresIn: "7d"
    - Return 201 { token, user: { _id, name, email, role } }

  POST /login
    - Find user by email → 400 if not found
    - bcryptjs.compare password → 401 if wrong
    - Sign same JWT shape
    - Return 200 { token, user: { _id, name, email, role } }

Wire /server/routes/auth.js into server.js (replace the stub).
Keep each file under 55 lines.
```

---

### 🔖 Commit 4 — `feat(products): CRUD routes + seed script`

```
Auth middleware exists. Models exist.

Create /server/routes/products.js:

GET /api/products
  - Accept query params: category, brand, minPrice, maxPrice, sort, page (default 1), limit (default 20)
  - Build mongoose filter object from query params (use $gte/$lte for price)
  - Sort map: "price_asc" → {price:1}, "price_desc" → {price:-1}, "newest" → {createdAt:-1}, "top_rated" → {"rating.average":-1}
  - Return { products, total, page }

GET /api/products/:id
  - Return single product or 404

POST /api/products (adminMiddleware)
  - Create product from req.body, return 201

PUT /api/products/:id (adminMiddleware)
  - findByIdAndUpdate with { new: true }, return updated product

DELETE /api/products/:id (adminMiddleware)
  - findByIdAndDelete, return { message: "Deleted" }

Wire routes into server.js.

Create /server/seed.js:
  - Connect to MONGO_URI from dotenv
  - Delete all existing products
  - Insert array of 20 varied sample products across 5 categories:
    Electronics, Clothing, Books, Home, Sports
  - Each product has realistic name, description, price (₹200–₹50000), stock 5–100,
    images: [ "https://via.placeholder.com/400x400?text=ProductName" ],
    rating: { average: random 3.5–5.0, count: random 10–200 }
  - console.log "Seeded 20 products" then process.exit(0)

Keep products.js under 70 lines, seed.js under 60 lines.
```

---

### 🔖 Commit 5 — `feat(orders): create order, my orders, admin orders, status update`

```
Auth + admin middleware exist. Order model exists.

Create /server/routes/orders.js:

POST /api/orders (authMiddleware)
  - Body: { items, shippingAddress, paymentMethod, totalAmount }
  - Create order with userId = req.user._id
  - Return 201 with created order

GET /api/orders/mine (authMiddleware)
  - Find orders where userId = req.user._id
  - Sort by createdAt desc
  - Return array

GET /api/orders (adminMiddleware)
  - Find all orders, populate userId with name + email
  - Sort by createdAt desc
  - Return array

PUT /api/orders/:id/status (adminMiddleware)
  - Body: { status }
  - Validate status is one of: Pending, Processing, Delivered
  - findByIdAndUpdate, return updated order

Wire into server.js.
Add GET /api/orders/stats (adminMiddleware) that returns:
  { totalProducts, totalOrders, totalUsers }
  using Promise.all of three countDocuments calls.

Keep file under 65 lines.
```

---

### 🔖 Commit 6 — `feat(reviews): add review, get reviews per product`

```
Auth middleware + Review model exist.

Create /server/routes/reviews.js:

POST /api/reviews/:productId (authMiddleware)
  - Body: { rating, comment }
  - Check if user already reviewed this product → 400 "Already reviewed"
  - Create review with userName from req.user (you may need to fetch User by _id to get name; do a quick User.findById lookup)
  - After creating review, recalculate product's rating.average and rating.count:
      const reviews = await Review.find({ productId })
      average = reviews.reduce((s,r) => s + r.rating, 0) / reviews.length
      await Product.findByIdAndUpdate(productId, { "rating.average": avg, "rating.count": reviews.length })
  - Return 201 with review

GET /api/reviews/:productId
  - Find all reviews for product, sort by createdAt desc
  - Return array

Wire into server.js.
Keep file under 55 lines. Backend is now complete.
```

---

## PHASE 2 — FRONTEND FOUNDATION

---

### 🔖 Commit 7 — `feat(client): Vite + Tailwind setup, routing skeleton, App.jsx`

```
Backend is complete in /server. Now bootstrap the React frontend.

Assume Vite + React + Tailwind CSS is already installed in /client.
(Do not write install commands — just create config and source files.)

Create/update:

/client/index.html
  - Add Google Fonts Inter link in <head>:
    https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap
  - Standard Vite React template otherwise

/client/src/main.jsx
  - ReactDOM.createRoot render <App /> wrapped in BrowserRouter

/client/src/App.jsx
  - Import Routes, Route from react-router-dom
  - Wrap entire app in AuthProvider then CartProvider (context providers — stubs OK for now)
  - Define all routes:
    /              → <Home />
    /products      → <Products />
    /products/:id  → <ProductDetail />
    /cart          → <Cart />
    /checkout      → <Checkout /> (PrivateRoute)
    /orders        → <Orders /> (PrivateRoute)
    /login         → <Login />
    /register      → <Register />
    /admin         → <AdminDashboard /> (PrivateRoute adminOnly)
    /admin/products → <AdminProducts /> (PrivateRoute adminOnly)
    /admin/orders  → <AdminOrders /> (PrivateRoute adminOnly)
  - PrivateRoute component: reads token from localStorage; if missing → <Navigate to="/login" />; if adminOnly and role !== admin → <Navigate to="/" />
  - All page components: import as lazy stubs (just export default () => <div>PageName</div> for now)
  - Navbar component rendered outside Routes (always visible)

Create all stub page files in /client/src/pages/ and /client/src/pages/admin/ so imports resolve.

Keep App.jsx under 70 lines.
```

---

### 🔖 Commit 8 — `feat(context): AuthContext and CartContext with localStorage sync`

```
App.jsx and routing skeleton exist.

Create /client/src/context/AuthContext.jsx:
  - createContext + useContext export (export useAuth hook)
  - State: user (object), token (string)
  - On mount: read token + user from localStorage, set state
  - login(token, user): save to localStorage + state
  - logout(): clear localStorage keys "token" and "user", reset state
  - Provide: { user, token, login, logout, isAdmin: user?.role === "admin" }

Create /client/src/context/CartContext.jsx:
  - createContext + useContext export (export useCart hook)
  - State: cartItems (array), initialized from localStorage "cart" key (JSON.parse, fallback [])
  - Every state change: useEffect to write cartItems to localStorage "cart"
  - addToCart(item): item shape { productId, name, price, quantity, image }
    If item already in cart, increase quantity; else push new entry
  - removeFromCart(productId): filter out
  - updateQuantity(productId, qty): map and update
  - clearCart(): set []
  - Derived: cartCount (sum of quantities), cartTotal (sum of price*quantity)
  - Provide all above

Each file under 55 lines.
```

---

### 🔖 Commit 9 — `feat(lib): axios instance with base URL + auth header injection`

```
AuthContext exists and stores token in localStorage under key "token".

Create /client/src/lib/axios.js:
  - Create axios instance with baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  - Add request interceptor:
    reads localStorage.getItem("token")
    if token exists: set config.headers.Authorization = `Bearer ${token}`
    return config
  - Export as default

Create /client/.env.example:
  VITE_API_URL=http://localhost:5000/api

This is the single axios instance used everywhere in the app.
Keep file under 25 lines.
```

---

## PHASE 3 — FRONTEND PAGES

---

### 🔖 Commit 10 — `feat(navbar): sticky navbar with logo, nav links, cart badge, auth button`

```
AuthContext and CartContext exist. Axios lib exists.

Replace the stub in /client/src/components/Navbar.jsx with a full implementation:

Design tokens to use (Tailwind):
  - Wrapper: sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm
  - Inner: max-w-7xl mx-auto px-4 h-16 flex items-center justify-between
  - Logo: font-bold text-xl text-indigo-600 (text: "ShopIndi")
  - Nav links (center, hidden on mobile): /products "Products" — use NavLink with active:text-indigo-600
  - Right side: cart icon button + auth button

Cart icon:
  - Use a simple SVG cart icon or Unicode 🛒
  - Badge: if cartCount > 0, show absolute positioned span with bg-indigo-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center
  - Clicking navigates to /cart

Auth section:
  - If logged in: show user name (truncated 12 chars) + "Logout" button (text-sm text-red-500)
  - If not logged in: "Login" button (bg-indigo-600 text-white rounded-full px-4 py-1.5 text-sm)
  - If isAdmin: show "Admin" link → /admin

Mobile: hamburger menu is NOT needed — just hide nav links on mobile (hidden md:flex)

Keep under 80 lines.
```

---

### 🔖 Commit 11 — `feat(auth-pages): Login and Register pages with form validation`

```
AuthContext exists (useAuth hook). Axios lib at /lib/axios.js.

Create /client/src/pages/Login.jsx:
  - Centered card: max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-gray-100
  - Title: "Welcome back" font-bold text-2xl text-gray-900
  - Form fields: Email, Password (controlled inputs)
  - Input style: w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm
  - Submit: POST /auth/login via axios
  - On success: call login(token, user) from useAuth, navigate to "/" (or /admin if admin)
  - Error: show red text message below form
  - Link to /register: "Don't have an account? Register"
  - Button: w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-2.5 font-medium transition

Create /client/src/pages/Register.jsx:
  - Same card layout
  - Fields: Name, Email, Password, Confirm Password
  - Client-side: check passwords match before submitting
  - POST /auth/register via axios
  - On success: call login(token, user), navigate to "/"
  - Link to /login

Keep each file under 80 lines. No third-party form libraries.
```

---

### 🔖 Commit 12 — `feat(home): hero banner + featured products section`

```
Navbar, ProductCard component (create it here), axios lib all available.

Create /client/src/components/ProductCard.jsx:
  - Props: product { _id, name, price, images, rating, stock }
  - Card: rounded-2xl shadow-sm hover:shadow-md transition duration-200 bg-white overflow-hidden cursor-pointer
  - Image: aspect-square object-cover rounded-xl w-full (use images[0] or placeholder)
  - Body padding: p-3
  - Name: font-medium text-gray-900 text-sm line-clamp-2
  - Price: font-bold text-indigo-600 text-base (format ₹XX,XXX with toLocaleString("en-IN"))
  - Stars: render filled ★ / empty ☆ based on Math.round(rating.average), text-amber-400 text-sm
  - "Add to Cart" button: w-full mt-2 bg-indigo-600 text-white text-sm rounded-full py-1.5 hover:bg-indigo-700 transition
    calls addToCart from useCart with quantity 1
  - Whole card click (except button) → navigate to /products/:_id

Create /client/src/pages/Home.jsx:
  Hero section:
    - Full-width bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-4 mt-4
    - Padding p-12, text-white
    - H1: "Shop Everything. Delivered Fast." text-4xl font-bold
    - Subtitle: "Discover thousands of products at unbeatable prices"
    - CTA button: "Shop Now" → navigate /products — bg-white text-indigo-600 rounded-full px-8 py-3 font-semibold

  Featured Products:
    - Fetch GET /api/products?limit=8&sort=top_rated on mount
    - Section title: "Featured Products" text-2xl font-bold text-gray-900 mb-6
    - Grid: grid grid-cols-2 md:grid-cols-4 gap-4
    - While loading: show 8 SkeletonCard components

Create /client/src/components/SkeletonCard.jsx:
  - Same dimensions as ProductCard but all divs with animate-pulse bg-gray-200 rounded-xl
  - aspect-square for image placeholder, two lines for text

Keep each file under 70 lines.
```

---

### 🔖 Commit 13 — `feat(products): product listing with sidebar filters and load more`

```
ProductCard, SkeletonCard, axios lib exist.

Create /client/src/pages/Products.jsx:

State: filters { category:[], brand:"", minPrice:"", maxPrice:"", sort:"newest" }, products [], page 1, total, loading

Layout: max-w-7xl mx-auto px-4 py-8 flex gap-6

LEFT SIDEBAR (w-64 shrink-0 hidden md:block):
  Section title "Filters" font-semibold text-gray-900 mb-4
  
  Category (hardcode): Electronics, Clothing, Books, Home, Sports
  Render as checkboxes. Toggle adds/removes from filters.category array.
  Label style: flex items-center gap-2 text-sm text-gray-700 cursor-pointer
  
  Price Range:
  Two inputs side by side: Min ₹ / Max ₹
  Input style: w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm

  Sort:
  <select> with options: newest, price_asc, price_desc, top_rated
  Same input style

  "Clear Filters" button: text-indigo-600 text-sm mt-4

RIGHT CONTENT (flex-1):
  Product count text: "Showing X products" text-sm text-gray-500 mb-4
  Grid: grid grid-cols-2 md:grid-cols-3 gap-4
  Products → <ProductCard />
  Loading → 6 <SkeletonCard />
  
  Load More button (if products.length < total):
  mx-auto block mt-8 border border-indigo-600 text-indigo-600 rounded-full px-8 py-2 hover:bg-indigo-50 transition

Fetch logic:
  useEffect on filters change: reset page to 1, fetch page 1
  Load More: fetch page+1, APPEND to products array (don't replace)
  Build query string from filters object (skip empty values)

Keep under 120 lines.
```

---

### 🔖 Commit 14 — `feat(product-detail): image, info, qty selector, add to cart, reviews`

```
CartContext (useCart), AuthContext (useAuth), axios lib, StarRating component (create it) exist.

Create /client/src/components/StarRating.jsx:
  - Props: rating (number), size (sm|md default md)
  - Render 5 stars: index < Math.round(rating) → ★ text-amber-400, else ☆ text-gray-300
  - size md: text-xl, sm: text-sm
  - Display rating number next to stars in text-gray-500

Create /client/src/pages/ProductDetail.jsx:

Fetch product on mount from GET /api/products/:id
Fetch reviews from GET /api/reviews/:productId

State: quantity (default 1), reviews [], reviewForm { rating:5, comment:"" }, submitLoading

Layout: max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-12

LEFT — Image:
  <img> with aspect-square object-cover rounded-2xl shadow-sm w-full

RIGHT — Info:
  Brand: text-sm text-gray-500 uppercase tracking-wide
  Name: text-3xl font-bold text-gray-900 mt-1
  <StarRating rating={product.rating.average} /> + "(N reviews)"
  Price: text-3xl font-bold text-indigo-600 mt-2
  Stock badge: if stock > 0 → "In Stock" bg-green-100 text-green-700, else "Out of Stock" bg-red-100 text-red-600 — rounded-full px-3 py-0.5 text-xs font-medium
  Description: text-gray-600 text-sm leading-relaxed mt-4
  
  Qty selector: flex items-center gap-3 mt-6
    "-" button (disable at 1), quantity display, "+" button (disable at stock)
    Buttons: w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-indigo-500
  
  Add to Cart: mt-4 w-full bg-indigo-600 text-white rounded-full py-3 font-semibold text-lg hover:bg-indigo-700 transition (disabled if out of stock)

REVIEWS SECTION (below grid, full width):
  "Customer Reviews" text-2xl font-bold mt-12 mb-6
  
  If logged in: form with
    - 5 clickable stars (set reviewForm.rating)  
    - textarea for comment (border border-gray-200 rounded-xl p-3 w-full text-sm resize-none)
    - Submit button: POST /api/reviews/:productId, refresh reviews on success
  
  Reviews list: map reviews →
    div border-b border-gray-100 py-4
    Name + date (top row), <StarRating size="sm">, comment

Keep under 130 lines.
```

---

### 🔖 Commit 15 — `feat(cart): cart page with quantity controls, item removal, total`

```
CartContext (useCart) with cartItems, removeFromCart, updateQuantity, cartTotal exists.

Create /client/src/pages/Cart.jsx:

If cartItems.length === 0:
  Centered empty state: cart icon (large, text-gray-300), "Your cart is empty", 
  "Browse Products" button → /products (bg-indigo-600 text-white rounded-full px-8 py-3)

If items exist:
Layout: max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8

LEFT (lg:col-span-2) — Items table:
  Header: "Shopping Cart" text-2xl font-bold + item count badge
  
  Each item row (border-b border-gray-100 py-4 flex gap-4):
    - Image: w-20 h-20 object-cover rounded-xl
    - Name + price per unit (flex-1)
    - Qty controls: same "-" / number / "+" pattern as ProductDetail, calls updateQuantity
    - Subtotal: font-semibold text-gray-900 (price × qty, formatted ₹)
    - Remove button: text-red-400 hover:text-red-600 "✕"

RIGHT — Order summary card:
  bg-gray-50 rounded-2xl p-6
  Title: "Order Summary" font-bold text-lg
  
  Rows: Subtotal | Shipping (₹99 flat, or "FREE" if cartTotal > 999) | Total
  Total: text-xl font-bold text-indigo-600
  
  "Proceed to Checkout" button: w-full bg-indigo-600 text-white rounded-full py-3 font-semibold hover:bg-indigo-700 transition → navigate /checkout

Keep under 90 lines.
```

---

### 🔖 Commit 16 — `feat(checkout): shipping form, payment selection, order placement`

```
CartContext (useCart — cartItems, cartTotal, clearCart), AuthContext (useAuth), axios lib exist.

Create /client/src/pages/Checkout.jsx:

State: form { name, phone, address, city, pincode, paymentMethod:"COD" }, loading, error

Layout: max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8

LEFT (lg:col-span-2):
  Section "Shipping Information" font-bold text-xl mb-4
  Grid of inputs (grid grid-cols-2 gap-4):
    Full Name (col-span-2), Phone, Address (col-span-2), City, Pincode
  Input style: w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm

  Section "Payment Method" font-bold text-xl mt-8 mb-4
  Two radio options styled as cards (border rounded-xl p-4 cursor-pointer):
    - COD: "💵 Cash on Delivery" — selected: border-indigo-500 bg-indigo-50
    - CARD: "💳 Pay by Card" — same selection style
  
  If CARD selected, show dummy card fields (grid grid-cols-3 gap-4):
    Card Number (col-span-3), Expiry (col-span-1), CVV (col-span-1)
    Add placeholder text (e.g. "4242 4242 4242 4242")
    Note: small gray text "This is a demo — no real payment is processed"

RIGHT — Order Summary:
  bg-gray-50 rounded-2xl p-6
  "Order Summary" font-bold text-lg mb-4
  List each cart item: image (w-12 h-12 rounded-lg) + name + qty × price
  Divider, Subtotal, Shipping (same ₹99/FREE logic), Total font-bold text-indigo-600

Place Order button (bottom of LEFT):
  w-full bg-indigo-600 text-white rounded-full py-3 font-semibold text-lg
  On click: POST /api/orders with { items: cartItems, shippingAddress: form, paymentMethod, totalAmount }
  On success: clearCart(), navigate /orders (pass state {success: true})
  Show inline error if API fails

Keep under 110 lines.
```

---

### 🔖 Commit 17 — `feat(orders): my orders list with expandable item details`

```
AuthContext, axios lib exist.

Create /client/src/pages/Orders.jsx:

On mount: check location.state?.success → show success banner "🎉 Order placed successfully!" (green, auto-dismiss 4s)

Fetch GET /api/orders/mine on mount.

State: orders [], loading, expandedId (null or order _id)

Page header: "My Orders" text-3xl font-bold text-gray-900

If loading: show 3 skeleton rows (animate-pulse)
If orders empty: "No orders yet" centered with "Start Shopping" button

Each order card (border border-gray-200 rounded-2xl p-5 mb-4):
  Top row (flex justify-between items-start):
    LEFT:
      Order # last 6 chars of _id in uppercase: font-mono text-sm text-gray-500
      Date: new Date(createdAt).toLocaleDateString("en-IN")
      Total: font-bold text-gray-900 (₹ formatted)
    RIGHT:
      Status badge:
        Pending → bg-yellow-100 text-yellow-700
        Processing → bg-blue-100 text-blue-700
        Delivered → bg-green-100 text-green-700
      rounded-full px-3 py-1 text-xs font-semibold

  "View Items" toggle button: text-indigo-600 text-sm mt-2 (toggles expandedId)

  Expandable items section (show if expandedId === order._id):
    border-t border-gray-100 mt-4 pt-4
    Each item: flex gap-3, image w-14 h-14 rounded-lg, name + qty + price

Keep under 90 lines.
```

---

## PHASE 4 — ADMIN PANEL

---

### 🔖 Commit 18 — `feat(admin-dashboard): stats cards + admin layout shell`

```
AuthContext, axios lib exist.

Create /client/src/pages/admin/Dashboard.jsx:

Fetch GET /api/orders/stats on mount.
Returns { totalProducts, totalOrders, totalUsers }

Layout: max-w-7xl mx-auto px-4 py-8

Admin nav tabs (flex gap-4 mb-8 border-b border-gray-200):
  "Dashboard" → /admin
  "Products" → /admin/products
  "Orders" → /admin/orders
  Each: pb-3 text-sm font-medium, active: border-b-2 border-indigo-600 text-indigo-600, inactive: text-gray-500

Stats section:
  "Dashboard" text-2xl font-bold text-gray-900 mb-6
  grid grid-cols-1 md:grid-cols-3 gap-6

Each stat card (bg-white rounded-2xl shadow-sm border border-gray-100 p-6):
  Icon (large emoji: 📦 🛒 👥)
  Value: text-4xl font-bold text-indigo-600 (show "—" while loading)
  Label: text-gray-500 text-sm mt-1 (Total Products / Total Orders / Total Users)

While loading: animate-pulse on value
Keep under 70 lines.
```

---

### 🔖 Commit 19 — `feat(admin-products): product table with add/edit/delete modal`

```
Axios lib, AdminTable concept, admin nav exist.

Create /client/src/pages/admin/Products.jsx:

State: products [], loading, showModal (bool), editProduct (null or product), formData (object), deleteConfirmId

Fetch GET /api/products?limit=100 on mount.

Table (overflow-x-auto):
  Columns: # | Image | Name | Category | Price | Stock | Actions
  Header: bg-gray-50 text-xs uppercase text-gray-500
  Row: hover:bg-gray-50 transition
  Image cell: <img> w-12 h-12 object-cover rounded-xl
  Price: ₹ formatted
  Stock: colored if stock < 10 → text-red-600 font-medium
  Actions: 
    Edit (pencil 🖊) → text-indigo-600 hover:text-indigo-800
    Delete (trash 🗑) → text-red-400 hover:text-red-600

"Add Product" button (top right): bg-indigo-600 text-white rounded-full px-5 py-2 text-sm font-medium

Modal (fixed inset-0 bg-black/40 flex items-center justify-center z-50):
  Inner: bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl
  Title: "Add Product" or "Edit Product"
  Form fields (grid grid-cols-2 gap-4):
    Name (col-span-2), Description (textarea col-span-2), Price, Stock, Category (select), Brand, Image URL (col-span-2)
  Buttons: Cancel (border rounded-full) + Save (bg-indigo-600 rounded-full)
  
  On Save: if editProduct → PUT /api/products/:id, else POST /api/products
  On Delete (with confirm): DELETE /api/products/:id
  Refresh products list after each mutation.

Keep under 130 lines.
```

---

### 🔖 Commit 20 — `feat(admin-orders): all orders table with inline status update`

```
Axios lib, admin nav exist.

Create /client/src/pages/admin/Orders.jsx:

Fetch GET /api/orders on mount (admin route returns all orders with populated user).

State: orders [], loading, updating (orderId being updated)

Table (overflow-x-auto):
  Columns: Order ID | Customer | Date | Total | Payment | Status | Update
  Header: bg-gray-50 text-xs uppercase text-gray-500
  
  Order ID: font-mono text-sm text-gray-500 (last 6 of _id)
  Customer: populated userId.name + userId.email (small text-gray-400 text-xs)
  Date: toLocaleDateString en-IN
  Total: ₹ formatted font-semibold
  Payment: "COD" or "CARD" badge (gray pill)
  Status: colored badge (same Pending/Processing/Delivered colors as Orders page)
  
  Update column: 
    <select> with three options (Pending, Processing, Delivered)
    defaultValue = current status
    onChange: PUT /api/orders/:id/status with new value
    While updating that specific row: disable select + show "..." text
    On success: update orders state in place (don't re-fetch)
    Select style: border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500

Page title: "All Orders" text-2xl font-bold + order count badge
Loading: 5 skeleton rows

Keep under 90 lines.
```

---

## PHASE 5 — POLISH

---

### 🔖 Commit 21 — `feat(ux): toast notification system + 404 page + error boundaries`

```
App.jsx routing exists.

Create /client/src/components/Toast.jsx:
  - A simple self-contained toast system using React context
  - ToastProvider wraps app (add to App.jsx providers list)
  - useToast() hook returns showToast(message, type) where type: "success"|"error"|"info"
  - Toast renders fixed bottom-right z-50 stack of toast divs
  - Each toast: rounded-xl px-4 py-3 text-sm text-white shadow-lg flex items-center gap-2
    success → bg-green-600, error → bg-red-500, info → bg-indigo-600
  - Auto-dismiss after 3000ms using useEffect + setTimeout
  - Entrance: translate-y-0 opacity-100, exit animation optional

Update these pages to use showToast instead of console.log or inline errors:
  - Checkout.jsx: showToast("Order placed! 🎉", "success") on success, showToast(err, "error") on fail
  - Login.jsx / Register.jsx: showToast on auth errors
  - Admin Products: showToast("Product saved", "success"), showToast("Deleted", "success")
  - ProductDetail review form: showToast("Review submitted!", "success")

Create /client/src/pages/NotFound.jsx:
  - Centered, mt-24
  - Large "404" text-8xl font-bold text-gray-200
  - "Page not found" text-xl text-gray-500 mt-2
  - "Go Home" button → /

Add <Route path="*" element={<NotFound />} /> in App.jsx.

Keep Toast.jsx under 70 lines. Page changes: only add showToast calls, nothing else.
```

---

### 🔖 Commit 22 — `chore: env wiring, README docs, final cleanup`

```
All features are built. Do final cleanup only — do not rewrite any working logic.

1. Update /README.md with:
   ## Setup
   ### Backend
   cd server && npm install
   cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
   node seed.js           # seed 20 products
   npm run dev            # nodemon server.js

   ### Frontend
   cd client && npm install
   cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
   npm run dev

   ## Deploy
   - Frontend: Vercel (set VITE_API_URL to Render backend URL)
   - Backend: Render (set env vars MONGO_URI, JWT_SECRET, PORT)
   - MongoDB: MongoDB Atlas free tier

   ## Default Admin
   Manually set role:"admin" on a registered user in MongoDB Atlas → Users collection.

2. Add to /server/package.json scripts:
   "dev": "nodemon server.js",
   "start": "node server.js"

3. Add to /client/package.json scripts (if not present):
   "dev": "vite",
   "build": "vite build",
   "preview": "vite preview"

4. Create /server/.gitignore and /client/.gitignore both containing:
   node_modules
   .env
   dist

5. Create root /.gitignore:
   node_modules
   .env
   dist
   .DS_Store

Do not touch any .jsx or route files. This commit is config/docs only.
```

---

## QUICK REFERENCE

| # | Commit | Key Files |
|---|--------|-----------|
| 1 | Monorepo scaffold | server.js, .env.example |
| 2 | Models | User, Product, Order, Review |
| 3 | Auth | routes/auth.js, middleware/auth.js, admin.js |
| 4 | Products API + Seed | routes/products.js, seed.js |
| 5 | Orders API + Stats | routes/orders.js |
| 6 | Reviews API | routes/reviews.js |
| 7 | Vite routing + stubs | App.jsx, all page stubs |
| 8 | Contexts | AuthContext.jsx, CartContext.jsx |
| 9 | Axios lib | lib/axios.js |
| 10 | Navbar | Navbar.jsx |
| 11 | Auth pages | Login.jsx, Register.jsx |
| 12 | Home + ProductCard + Skeleton | Home.jsx, ProductCard.jsx, SkeletonCard.jsx |
| 13 | Products listing | Products.jsx |
| 14 | Product detail + reviews | ProductDetail.jsx, StarRating.jsx |
| 15 | Cart page | Cart.jsx |
| 16 | Checkout | Checkout.jsx |
| 17 | My Orders | Orders.jsx |
| 18 | Admin Dashboard | admin/Dashboard.jsx |
| 19 | Admin Products modal | admin/Products.jsx |
| 20 | Admin Orders | admin/Orders.jsx |
| 21 | Toast + 404 | Toast.jsx, NotFound.jsx |
| 22 | Docs + config cleanup | README.md, .gitignore files |