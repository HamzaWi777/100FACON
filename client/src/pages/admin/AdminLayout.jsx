import React from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';

const menuItems = [
  { id: 'dashboard', label: '📊 Dashboard', path: '/admin/dashboard' },
  { id: 'products', label: '👕 Products',  path: '/admin/products' },
  { id: 'orders',   label: '📦 Orders',    path: '/admin/orders' },
  { id: 'customers',label: '👥 Customers', path: '/admin/customers' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const activeId = menuItems.find(item => location.pathname.includes(item.id))?.id || 'dashboard';

  const handleNav = (item) => {
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden bg-gradient-to-r from-purple-600 to-purple-700 shadow px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <span className="font-bold text-white font-serif text-lg">
          {menuItems.find(i => i.id === activeId)?.label}
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-purple-500 transition text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-purple-200 shadow-lg z-20 sticky top-[53px]">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`w-full text-left px-5 py-3 text-sm transition border-b border-purple-100 last:border-0 ${
                activeId === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop + mobile content wrapper ── */}
      <div className="md:flex md:gap-8 md:p-8 p-4">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sticky top-8">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 px-2">Panneau Admin</p>
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition text-sm font-medium ${
                    activeId === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/dashboard"  element={<AdminDashboard />} />
            <Route path="/products"   element={<AdminProducts />} />
            <Route path="/orders"     element={<AdminOrders />} />
            <Route path="/customers"  element={<AdminCustomers />} />
          </Routes>
        </main>

      </div>
    </div>
  );
}