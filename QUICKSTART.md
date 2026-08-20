# Quick Start Guide

## One-Click Setup (Recommended)

### Step 1: Install MySQL

If you don't have MySQL installed:
- **Windows**: Download from https://dev.mysql.com/downloads/mysql/
- **Mac**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

Start MySQL:
```bash
# Windows - MySQL is usually a service
# Mac/Linux
brew services start mysql
```

### Step 2: Create Database

Open MySQL and run:
```sql
CREATE DATABASE ecommerce_db;
```

### Step 3: Clone & Install

```bash
cd Website
npm install
```

### Step 4: Configure Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce_db
JWT_SECRET=your_secret_key_here_change_me
CORS_ORIGIN=http://localhost:5173
```

### Step 5: Configure Frontend (Optional)

```bash
cd client
cp .env.example .env
```

The default configuration should work. Only change if your API runs on a different port.

### Step 6: Start the Application

From the root `Website` directory:

```bash
npm run dev
```

This will start both servers:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## First Time Setup

On first run, the backend will automatically:
1. Create all database tables
2. Create an admin user

**Admin Credentials:**
- Email: `admin@store.com`
- Password: `admin123`

## Testing the Application

### 1. Visit the Homepage
Open http://localhost:5173 in your browser

### 2. Register a New Account
Click "Register" and create a test account

### 3. Browse Products
- Currently no products exist
- Login as admin to add products

### 4. Admin Dashboard
1. Login with admin credentials
2. Go to http://localhost:5173/admin/dashboard
3. Add some products
   - Include images (up to 5 per product)
   - Set size and color options
4. Go back to shop and test shopping

### 5. Place an Order
1. Add products to cart
2. Go to checkout
3. Complete the order
4. View in "My Orders"

### 6. Manage Orders (Admin)
1. Go to Admin > Orders
2. See pending orders
3. Update order status
4. Watch the status change on customer side

## Project Structure

```
Website/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   ├── context/       # Auth context
│   │   └── App.jsx        # Main app
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth, upload, etc.
│   ├── validators/        # Input validation
│   ├── database/          # Schema & init
│   ├── config/            # Database connection
│   ├── uploads/           # Product images
│   ├── server.js          # Entry point
│   ├── package.json
│   └── .env.example
│
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Production guide
├── package.json           # Workspace config
└── .gitignore
```

## Common Tasks

### Add a Product (Admin)

1. Login as admin
2. Go to Admin Dashboard → Products
3. Click "Add Product"
4. Fill in:
   - Name
   - Description
   - Price
   - Category
   - Stock quantity
   - Colors (comma-separated)
   - Upload images
5. Click "Create Product"

### Update Order Status (Admin)

1. Go to Admin Dashboard → Orders
2. Click an order from the list
3. Change status dropdown
4. Status updates immediately

### View Customer Orders

1. Login as a customer
2. Click "Orders" in header
3. Select an order to view details
4. See all items, total, and shipping info

## Troubleshooting

### Port 5000 or 5173 Already in Use

**Windows:**
```bash
# Find process on port 5000
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

### MySQL Connection Error

```bash
# Check MySQL is running
mysql -u root

# If failed, start MySQL:
# Windows: services.msc → find MySQL → start
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Database Already Exists Error

The database will be created on first run. If you get an error:
```sql
DROP DATABASE ecommerce_db;
CREATE DATABASE ecommerce_db;
```

### CORS Error

If frontend can't reach backend:
1. Check backend is running on port 5000
2. Verify `.env` has `CORS_ORIGIN=http://localhost:5173`
3. Restart backend: `npm run dev`

### Images Not Showing

1. Make sure uploads are saved to `/server/uploads/`
2. Backend is serving uploads: `app.use('/uploads', express.static('uploads'))`
3. Check image paths in database are correct

## Next Steps

1. **Add More Products**: Use admin panel to populate catalog
2. **Customize Styling**: Edit Tailwind config and CSS
3. **Add Features**: Extend API with new endpoints
4. **Deploy**: Follow DEPLOYMENT.md for production setup

## Documentation

- Full setup guide: [README.md](./README.md)
- Deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Backend docs: [server/README.md](./server/README.md)
- Frontend docs: [client/README.md](./client/README.md)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs: `npm run dev` output
3. Check browser console for frontend errors
4. Verify all `.env` variables are set correctly
5. Ensure ports 5000 and 5173 are available

## Key Features to Explore

✅ User registration and authentication  
✅ Product browsing with filters and search  
✅ Shopping cart functionality  
✅ Order placement and tracking  
✅ Admin dashboard with stats  
✅ Product management (CRUD)  
✅ Order management and status updates  
✅ Customer list management  
✅ Image uploads for products  
✅ Responsive mobile design  

Enjoy your e-commerce platform! 🚀
