# 🏗️ Architecture & System Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  React App (Port 5173)                                          │
│  ├── Routes                                                     │
│  │   ├── Public (Home, Products, Product Detail, Auth)         │
│  │   ├── Protected (Cart, Checkout, Orders)                    │
│  │   └── Admin (Dashboard, Products, Orders, Customers)        │
│  │                                                              │
│  ├── Components                                                │
│  │   ├── Header & Footer                                      │
│  │   ├── Forms & Controls                                     │
│  │   └── Data Tables & Grids                                  │
│  │                                                              │
│  ├── Services                                                  │
│  │   └── API Client (Axios with JWT interceptor)             │
│  │                                                              │
│  └── Context                                                   │
│      └── Auth (User state, Login/Logout)                      │
│                                                                 │
└─────────────────────────────────────────┬───────────────────────┘
                                         │ HTTP/REST
                            ┌────────────▼────────────┐
                            │   CORS Enabled         │
                            └────────────┬────────────┘
                                         │
┌─────────────────────────────────────────▼────────────────────────┐
│                    EXPRESS SERVER (Port 5000)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Middleware Stack                                               │
│  ├── CORS Handler                                              │
│  ├── JSON Parser                                               │
│  ├── JWT Verifier (verifyToken, verifyAdmin)                  │
│  ├── File Upload (Multer)                                      │
│  └── Validator (express-validator)                             │
│                                                                 │
│  Routes & Controllers                                           │
│  ├── /api/auth - Auth Routes                                   │
│  │   └── register, login, getCurrentUser                       │
│  │                                                              │
│  ├── /api/products - Product Routes                            │
│  │   └── getAll, getById, create, update, delete              │
│  │                                                              │
│  ├── /api/cart - Cart Routes                                   │
│  │   └── getCart, addToCart, updateItem, remove               │
│  │                                                              │
│  ├── /api/orders - Order Routes                                │
│  │   └── createOrder, getUserOrders, getDetails, getAllOrders │
│  │                                                              │
│  └── /api/users - User Routes                                  │
│      └── getAllUsers                                           │
│                                                                 │
│  Static Files                                                   │
│  └── /uploads - Product Images                                │
│                                                                 │
└─────────────────────────────────────────┬───────────────────────┘
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
        ┌───────────────────┐  ┌──────────────────┐   ┌──────────┐
        │   MySQL Database  │  │  File Storage    │   │   Logs   │
        │   (Port 3306)     │  │  (/uploads)      │   │          │
        └───────────────────┘  └──────────────────┘   └──────────┘
        │                      │
        ├─ users table        ├─ product-*.jpg
        ├─ products table     └─ product-*.png
        ├─ orders table
        ├─ order_items table
        └─ cart table
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Interaction│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  React Component │
│  (Page/Form)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  Axios API Call      │
│  (with JWT Token)    │
└────────┬─────────────┘
         │
         ▼ HTTP POST/GET/PUT/DELETE
┌──────────────────────┐
│  Express Route       │
│  Handler            │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Middleware Chain    │
│  - Validate Auth     │
│  - Validate Input    │
│  - Check Permissions │
└────────┬─────────────┘
         │
         ▼ (if valid)
┌──────────────────────┐
│  Controller Logic    │
│  - Process Request   │
│  - Business Rules    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Database Query      │
│  (MySQL)             │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Database Result     │
│  (Rows/Data)         │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Format Response     │
│  (JSON)              │
└────────┬─────────────┘
         │
         ▼ HTTP Response
┌──────────────────────┐
│  React receives Data │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Update State        │
│  (Context/Hooks)     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Component Re-render │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  User Sees Update    │
│  UI Refreshed        │
└──────────────────────┘
```

## Authentication Flow

```
┌───────────────┐
│  User visits  │
│  /register    │
└───────┬───────┘
        │
        ▼
┌──────────────────────┐
│  Fill Registration   │
│  Form & Submit       │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  POST /auth/register │
│  (name, email, pwd)  │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Backend validates   │
│  - Email unique?     │
│  - Password >= 6     │
└───────┬──────────────┘
        │
        ├─ Invalid ──▶ Return Error Message
        │
        └─ Valid
        │
        ▼
┌──────────────────────┐
│  Hash Password       │
│  (bcrypt, 10 rounds) │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Create User in DB   │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Generate JWT Token  │
│  (exp: 7 days)       │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Return Token & User │
│  to Frontend         │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Save Token in       │
│  localStorage        │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Redirect to Home    │
│  User Logged In      │
└──────────────────────┘

// For Subsequent Requests:
┌──────────────────────┐
│  All API Calls       │
│  Include Header:     │
│  Authorization:      │
│    Bearer <token>    │
└───────┬──────────────┘
        │
        ▼
┌──────────────────────┐
│  Backend verifies    │
│  JWT Token Valid     │
└───────┬──────────────┘
        │
        ├─ Invalid ──▶ Return 401 Unauthorized
        │
        └─ Valid ──▶ Process Request
```

## Shopping Flow

```
┌─────────────────┐
│  Browse Products│
│  (GET /products)│
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Click Product       │
│  (GET /products/:id) │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Select Options      │
│  - Size              │
│  - Color             │
│  - Quantity          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Add to Cart         │
│  (POST /cart)        │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  View Cart Items     │
│  (GET /cart)         │
│  - Review items      │
│  - Update quantities │
│  - Remove items      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Proceed to          │
│  Checkout            │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Fill Shipping Info  │
│  - Address           │
│  - Phone             │
│  - Wilaya             │
│  - Notes (optional)  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Review Order        │
│  - Items             │
│  - Total Price       │
│  - Shipping Info     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Confirm Order       │
│  (POST /orders)      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Backend:            │
│  - Create Order      │
│  - Create Order Items│
│  - Reduce Stock      │
│  - Clear Cart        │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Return Order ID     │
│  Redirect to Orders  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  View My Orders      │
│  (GET /orders/my)    │
│  - Track status      │
│  - View details      │
└──────────────────────┘
```

## Admin Order Management Flow

```
┌──────────────────┐
│  View All Orders │
│  (GET /orders)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  Click on Order              │
│  (GET /orders/:id - API call)│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  See Order Details:          │
│  - Items with images         │
│  - Shipping address          │
│  - Customer info             │
│  - Current Status            │
│  - Notes                     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Update Status (Dropdown)    │
│  pending → confirmed → ...   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  PUT /orders/:id/status      │
│  (Backend updates DB)        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Status Changed              │
│  Customer sees update in:    │
│  - My Orders page            │
└──────────────────────────────┘
```

## Component Tree

```
App
├── Header
│   ├── Navigation Links
│   ├── Auth Buttons (Login/Register)
│   └── User Menu (if logged in)
├── Main Routes
│   ├── Public Routes
│   │   ├── HomePage
│   │   │   ├── Hero Banner
│   │   │   ├── Categories Grid
│   │   │   └── Featured Products
│   │   ├── ProductsPage
│   │   │   ├── FilterSidebar
│   │   │   └── ProductGrid
│   │   ├── ProductDetailPage
│   │   │   ├── ImageGallery
│   │   │   ├── ProductInfo
│   │   │   └── AddToCart Button
│   │   ├── LoginPage
│   │   └── RegisterPage
│   │
│   ├── Protected Routes
│   │   ├── CartPage
│   │   │   ├── CartItems
│   │   │   └── OrderSummary
│   │   ├── CheckoutPage
│   │   │   ├── ShippingForm
│   │   │   └── OrderSummary
│   │   └── MyOrdersPage
│   │       ├── OrdersList
│   │       └── OrderDetails
│   │
│   └── Admin Routes
│       ├── AdminLayout
│       │   ├── Sidebar
│       │   └── Main Content
│       ├── AdminDashboard
│       │   ├── StatsCards
│       │   └── RecentOrders
│       ├── AdminProducts
│       │   ├── ProductForm
│       │   └── ProductsTable
│       ├── AdminOrders
│       │   ├── OrdersTable
│       │   └── OrderDetails
│       └── AdminCustomers
│           └── CustomersTable
│
├── Footer
│   ├── Links
│   └── Info

└── Toaster (for notifications)
```

## Database Relationships

```
users (1)
  │
  ├─── (1:N) ──────> orders (N)
  │                    │
  │                    ├─── (1:N) ──────> order_items (N)
  │                    │                      │
  │                    │                      └─── (N:1) ──────> products
  │                    │
  │                    └─── product_id foreign key
  │
  └─── (1:N) ──────> cart (N)
                       │
                       └─── (N:1) ──────> products

users
  id, full_name, email, password, phone, address, wilaya, role, created_at

products
  id, name, description, price, category, stock, images, sizes, colors, 
  is_featured, created_at

orders
  id, user_id (FK), total_price, shipping_address, phone, wilaya, 
  status, notes, created_at

order_items
  id, order_id (FK), product_id (FK), quantity, size, color, price

cart
  id, user_id (FK), product_id (FK), quantity, size, color, created_at
```

## Request/Response Cycle

```
Frontend                 Network              Backend              Database
   │                        │                    │                     │
   │─────── POST ────────────>                   │                     │
   │      /api/auth/login    │                   │                     │
   │      (email, password)  │                   │                     │
   │                         │──── Request ─────>│                     │
   │                         │                   │─ Verify Input       │
   │                         │                   │─ Query User ────────>│
   │                         │                   │                     │
   │                         │                   │<─── User Record ────│
   │                         │                   │─ Verify Password    │
   │                         │                   │─ Generate JWT       │
   │                         │<─ Response ───────│                     │
   │<────────── JSON ─────────│                   │                     │
   │   {token, user}         │                   │                     │
   │                         │                   │                     │
   │─ Save token in          │                   │                     │
   │  localStorage           │                   │                     │
   │                         │                   │                     │
   │─ Update Auth Context    │                   │                     │
   │                         │                   │                     │
   │─── GET with Header ─────>                   │                     │
   │    Authorization:       │                   │                     │
   │    Bearer <token>       │                   │                     │
   │                         │──── Request ─────>│                     │
   │                         │    (with token)   │─ Verify Token       │
   │                         │                   │─ Query Data ────────>│
   │                         │                   │                     │
   │                         │                   │<─── Data Record ────│
   │                         │<─ Response ───────│                     │
   │<────────── JSON ─────────│                   │                     │
   │    (protected data)     │                   │                     │
```

## Security Layers

```
┌────────────────────────────────────────────┐
│         Frontend Security                  │
├────────────────────────────────────────────┤
│ - HTTPS/SSL encryption                    │
│ - Sanitized inputs                        │
│ - Protected routes                        │
│ - Token refresh on 401                    │
│ - localStorage with secure flag           │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│         CORS Configuration                 │
├────────────────────────────────────────────┤
│ - Whitelist origin                        │
│ - Allowed methods                         │
│ - Allowed headers                         │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│      Express Middleware Stack              │
├────────────────────────────────────────────┤
│ - Body parser                             │
│ - JWT verification                        │
│ - Input validation                        │
│ - Error handling                          │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│       Controller Business Logic            │
├────────────────────────────────────────────┤
│ - Authorization checks                    │
│ - Data validation                         │
│ - Business rule enforcement               │
│ - Parameterized queries                   │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│         Database Layer                     │
├────────────────────────────────────────────┤
│ - Connection pooling                      │
│ - Encrypted connections                   │
│ - User permissions                        │
│ - Prepared statements                     │
└────────────────────────────────────────────┘
```

---

For more architectural details, see:
- [README.md](./README.md)
- [server/README.md](./server/README.md)
- [client/README.md](./client/README.md)
