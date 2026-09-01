import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PrivateRoute, AdminRoute } from './components/ProtectedRoute';
import { WhatsAppButton } from './components/WhatsAppButton';
import { trackPageView } from './utils/metaPixel';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTracker />
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Protected Routes */}
              <Route path="/my-orders" element={<MyOrdersPage />} />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Page not found</h1>
                    <a href="/" className="text-gray-900 hover:underline">
                      Go home
                    </a>
                  </div>
                }
              />
              
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
