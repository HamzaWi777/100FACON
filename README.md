# E-Commerce Clothing Store

A full-stack e-commerce application for buying and selling clothing items. This monorepo contains both frontend and backend applications.

## Project Structure

```
├── client/              # React + Vite frontend
├── server/              # Express.js backend
├── server/uploads/      # Uploaded product images
└── package.json         # Root workspace config
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Notifications**: React Hot Toast

## Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v5.7+)

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# This will also install dependencies for both client and server
```

### 2. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE ecommerce_db;
```

2. Configure backend environment:
```bash
cd server
cp .env.example .env
```

3. Update `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
JWT_SECRET=your_secret_key_here
```

### 3. Configure Frontend

```bash
cd client
cp .env.example .env
```

The default API URL is `http://localhost:5000/api`

### 4. Start Development Servers

From the root directory:
```bash
npm run dev
```

This will start both servers concurrently:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## Demo Account

**Email**: `admin@store.com`  
**Password**: `admin123`

## Database Schema

### Users Table
- Stores user information (name, email, password, address, wilaya)
- Supports two roles: `client` and `admin`
- Password is hashed using bcrypt

### Products Table
- Product details (name, price, description, stock)
- Supports images (JSON array of paths)
- Configurable sizes and colors
- Featured product flag

### Orders Table
- Order information linked to users
- Status tracking (pending → confirmed → shipped → delivered)
- Shipping details (address, phone, wilaya)

### Order Items Table
- Items in each order
- Captures product state at time of purchase (price, size, color)

### Cart Table
- Persistent shopping cart
- Unique constraint on (user_id, product_id, size, color)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get cart items (protected)
- `POST /api/cart` - Add to cart (protected)
- `PUT /api/cart/:id` - Update quantity (protected)
- `DELETE /api/cart/:id` - Remove item (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders/my-orders` - User's orders (protected)
- `GET /api/orders/details/:id` - Order details (protected)
- `GET /api/orders` - All orders (admin)
- `PUT /api/orders/:id/status` - Update status (admin)

### Users
- `GET /api/users` - List all users (admin)

## Frontend Features

### For Customers
- Browse products with search and filters
- View product details with images
- Add items to cart with size/color selection
- Checkout with shipping information
- Track orders and view order history

### For Administrators
- Dashboard with order and product stats
- Manage products (create, edit, delete, upload images)
- Manage orders and update status
- View all customers

## File Uploads

Product images are stored in `/server/uploads/` and served as static files.

- Maximum file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Multiple images per product supported

## Authentication Flow

1. User registers or logs in
2. Server returns JWT token
3. Token is stored in localStorage
4. Token is automatically included in API requests via axios interceptor
5. Token expires after 7 days
6. Protected routes check authentication status

## Environment Configuration

### Server (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ecommerce_db
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Error Handling

- All errors return appropriate HTTP status codes
- Validation errors include detailed error messages
- Frontend displays user-friendly error notifications
- Backend logs errors for debugging

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for stateless authentication
- Protected API endpoints with role-based access
- CORS configured for frontend domain
- Input validation and sanitization
- SQL injection prevention via parameterized queries

## Development Scripts

### Root
- `npm run dev` - Start both servers in development
- `npm run build` - Build both applications

### Server
- `npm run dev` - Start with auto-reload
- `npm start` - Start production server

### Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

### Backend
1. Build: `npm run build` (or just npm start for Node.js)
2. Set environment variables
3. Run: `npm start`

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to static hosting or CDN

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists

### CORS Error
- Check `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches

### Images Not Loading
- Verify `/server/uploads/` directory exists
- Check file upload permissions
- Verify image paths in database

### Authentication Issues
- Clear localStorage and re-login
- Check JWT_SECRET is set correctly
- Verify token expiration

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
