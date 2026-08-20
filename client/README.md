# E-Commerce Frontend

React + Vite frontend application for the e-commerce store.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

### Public Pages
- **Home**: Hero banner, featured products, categories, why choose us section
- **Products**: Grid view with filters (category, price range), search, sorting, pagination
- **Product Detail**: Image gallery, size/color selector, quantity picker, add to cart
- **Login/Register**: User authentication with form validation

### Client Pages (Protected)
- **Cart**: View cart items, update quantities, remove items, order summary
- **Checkout**: Shipping form, order summary, order confirmation
- **My Orders**: View all orders, order details with items

### Admin Pages (Protected)
- **Dashboard**: Stats cards, recent orders table
- **Products**: Manage products (create, edit, delete), upload images
- **Orders**: View and manage orders, update order status
- **Customers**: View all registered customers

## Technologies

- **React 18**: UI framework
- **React Router 6**: Client-side routing
- **Vite**: Build tool and dev server
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **React Hot Toast**: Notifications
- **JWT**: Token-based authentication

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

## Project Structure

```
src/
├── components/          # Reusable components
├── pages/              # Page components
├── pages/admin/        # Admin page components
├── context/            # Auth context
├── services/           # API services
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- Authentication uses JWT tokens stored in localStorage
- Admin pages require admin role
- Protected routes redirect to login if not authenticated
- Images are served from backend `/uploads` directory
- API calls include automatic JWT token injection
