# File Structure & Complete File List

## Root Directory Files

```
Website/
├── package.json                 # Workspace configuration
├── README.md                    # Main documentation
├── QUICKSTART.md               # Quick start guide
├── DEPLOYMENT.md               # Production deployment guide
├── CHECKLIST.md                # Feature checklist
├── .gitignore                  # Git ignore rules
└── FILES.md                    # This file
```

## Backend Files (/server)

### Configuration & Setup
```
server/
├── package.json                # Backend dependencies
├── server.js                   # Main Express server
├── .env.example               # Environment variables template
└── README.md                  # Backend documentation

config/
├── database.js                # MySQL connection pool

database/
├── schema.sql                 # Complete SQL schema
└── init.js                    # Database initialization

middleware/
├── auth.js                    # JWT verification, error handling
└── upload.js                  # Multer file upload config

validators/
└── index.js                   # Express-validator rules

routes/
├── auth.js                    # Authentication endpoints
├── products.js                # Product endpoints
├── cart.js                    # Shopping cart endpoints
├── orders.js                  # Order endpoints
└── users.js                   # User management endpoints

controllers/
├── authController.js          # Register, login, get user
├── productController.js       # CRUD operations for products
├── cartController.js          # Cart operations
├── orderController.js         # Order creation and management
└── userController.js          # User listing

uploads/                       # Product images directory (auto-created)
```

### Backend Dependencies
- express (web framework)
- mysql2 (database driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- multer (file uploads)
- cors (cross-origin)
- express-validator (validation)
- dotenv (environment config)
- nodemon (development)

## Frontend Files (/client)

### Configuration & Setup
```
client/
├── package.json               # Frontend dependencies
├── index.html                # Entry HTML
├── .env.example              # Environment variables template
├── README.md                 # Frontend documentation
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration

src/
├── main.jsx                  # React entry point
├── index.css                 # Global styles & Tailwind imports
└── App.jsx                   # Main app component with routing

components/
├── Header.jsx                # Navigation header
├── Footer.jsx                # Footer component
└── ProtectedRoute.jsx        # Route protection wrapper

context/
└── AuthContext.jsx           # Authentication context provider

services/
├── api.js                    # Axios instance with interceptors
└── index.js                  # API service functions

pages/
├── HomePage.jsx              # Home page
├── ProductsPage.jsx          # Products listing
├── ProductDetailPage.jsx     # Single product detail
├── LoginPage.jsx             # Login form
├── RegisterPage.jsx          # Registration form
├── CartPage.jsx              # Shopping cart
├── CheckoutPage.jsx          # Checkout form
└── MyOrdersPage.jsx          # User orders

pages/admin/
├── AdminLayout.jsx           # Admin sidebar layout
├── AdminDashboard.jsx        # Dashboard with stats
├── AdminProducts.jsx         # Product management
├── AdminOrders.jsx           # Order management
└── AdminCustomers.jsx        # Customer listing

utils/                        # Utility functions (optional)
```

### Frontend Dependencies
- react (UI library)
- react-dom (DOM rendering)
- react-router-dom (routing)
- axios (HTTP client)
- react-hot-toast (notifications)
- tailwindcss (styling)
- autoprefixer (CSS processing)
- postcss (CSS transformation)
- vite (build tool)
- @vitejs/plugin-react (React plugin)

## Key Files Explained

### Backend Core Files

**server.js**
- Express app initialization
- Middleware setup (CORS, JSON)
- Route registration
- Database initialization
- Server startup

**config/database.js**
- MySQL connection pool
- Connection configuration
- Error handling

**database/schema.sql**
- All 5 table definitions
- Primary/foreign keys
- Indexes and constraints
- UTF-8 encoding

**database/init.js**
- Schema execution
- Admin user creation
- Error handling

**middleware/auth.js**
- JWT verification (verifyToken)
- Admin checking (verifyAdmin)
- Global error handler

**middleware/upload.js**
- Multer configuration
- File validation
- Storage configuration

**validators/index.js**
- All input validation rules
- Using express-validator
- Custom validation functions

### Frontend Core Files

**App.jsx**
- BrowserRouter setup
- Route definitions
- Auth provider wrapper
- Toaster component

**context/AuthContext.jsx**
- Auth state management
- Login/logout functions
- useAuth hook

**services/api.js**
- Axios instance
- Base URL configuration
- Token injection interceptor

**services/index.js**
- API service functions
- All endpoint definitions
- Request/response handling

## Database Schema

### Users Table
```sql
id, full_name, email, password, phone, address, wilaya, role, created_at
```

### Products Table
```sql
id, name, description, price, category, stock, images, sizes, colors, is_featured, created_at
```

### Orders Table
```sql
id, user_id, total_price, shipping_address, phone, wilaya, status, notes, created_at
```

### Order Items Table
```sql
id, order_id, product_id, quantity, size, color, price
```

### Cart Table
```sql
id, user_id, product_id, quantity, size, color, created_at
```

## Environment Configuration

### Backend .env
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
DB_PORT=3306
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Frontend .env
```
VITE_API_URL=http://localhost:5000/api
```

## Routes Summary

### Authentication Routes
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Product Routes
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Cart Routes
- GET /api/cart
- POST /api/cart
- PUT /api/cart/:id
- DELETE /api/cart/:id

### Order Routes
- POST /api/orders
- GET /api/orders/my-orders
- GET /api/orders/details/:id
- GET /api/orders
- PUT /api/orders/:id/status

### User Routes
- GET /api/users

## Frontend Routes

### Public Routes
- / (HomePage)
- /products (ProductsPage)
- /product/:id (ProductDetailPage)
- /login (LoginPage)
- /register (RegisterPage)

### Protected Routes
- /cart (CartPage)
- /checkout (CheckoutPage)
- /my-orders (MyOrdersPage)

### Admin Routes
- /admin/dashboard (AdminDashboard)
- /admin/products (AdminProducts)
- /admin/orders (AdminOrders)
- /admin/customers (AdminCustomers)

## Total Files Created

- **Backend**: 17 files
- **Frontend**: 21 files
- **Configuration & Docs**: 7 files
- **Total**: 45+ files

## Installation Checklist

After extracting files:
- [ ] Run `npm install` from root
- [ ] Create `.env` in `/server` folder
- [ ] Create `.env` in `/client` folder (optional)
- [ ] Update database credentials in server/.env
- [ ] Run `npm run dev`

## Important Notes

1. **Database**: MySQL must be installed and running
2. **Ports**: 5000 (backend) and 5173 (frontend) must be free
3. **Images**: Stored in `/server/uploads/` directory
4. **Tokens**: JWT tokens are stored in browser localStorage
5. **Admin**: Auto-created on first run (admin@store.com / admin123)

## Version Info

- Node.js: v16+ recommended
- npm: v7+ recommended
- MySQL: v5.7+ recommended
- React: v18
- Express: v4.18
- Vite: v5

## Support

For issues or questions, refer to:
- QUICKSTART.md for setup help
- DEPLOYMENT.md for production
- Individual README.md files in each folder
- Code comments throughout
