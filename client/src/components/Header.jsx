import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { cartService } from '../services';
import { getGuestCart } from '../utils/guestCart';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        if (!user) {
          const guestCart = getGuestCart();
          setCartCount(guestCart.reduce((sum, item) => sum + item.quantity, 0));
        } else {
          const response = await cartService.getCart();
          setCartCount(response.data.reduce((sum, item) => sum + item.quantity, 0));
        }
      } catch {
        setCartCount(0);
      }
    };
    fetchCartCount();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  const CartIcon = () => (
    <button
      onClick={() => navigate('/cart')}
      className="relative text-purple-600 hover:text-purple-700 transition"
      aria-label="Panier"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );

  return (
    <header className="bg-white border-b border-purple-100 shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div onClick={() => navigate('/')} className="cursor-pointer hover:opacity-75 transition">
          <Logo />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-8 items-center">
          <CartIcon />
          <button onClick={() => navigate('/products')} className="text-gray-700 hover:text-purple-600 font-medium transition">
            Collections
          </button>
          {!isAuthenticated ? (
            <>
              <button onClick={() => navigate('/login')} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Connexion
              </button>
              <button onClick={() => navigate('/register')} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2 rounded-full hover:from-purple-700 hover:to-purple-800 font-semibold transition shadow-md hover:shadow-lg">
                S'inscrire
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/my-orders')} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Commandes
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin/dashboard')} className="text-gray-700 hover:text-purple-600 font-medium transition">
                  Admin
                </button>
              )}
              <div className="relative">
                <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-purple-600 font-medium transition">
                  {user?.full_name}
                </button>
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-purple-100">
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition">
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile right side: cart icon + burger */}
        <div className="flex md:hidden items-center gap-4">
          <CartIcon />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-purple-600 hover:text-purple-700 transition"
            aria-label="Menu"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-purple-100 shadow-lg">
          <div className="flex flex-col px-4 py-2">
            <button onClick={() => { navigate('/products'); setIsOpen(false); }}
              className="text-left py-3 text-gray-700 hover:text-purple-600 border-b border-gray-100 font-medium transition">
              Collections
            </button>
            {!isAuthenticated ? (
              <>
                <button onClick={() => { navigate('/login'); setIsOpen(false); }}
                  className="text-left py-3 text-gray-700 hover:text-purple-600 border-b border-gray-100 font-medium transition">
                  Connexion
                </button>
                <button onClick={() => { navigate('/register'); setIsOpen(false); }}
                  className="text-left py-3 text-gray-700 hover:text-purple-600 font-medium transition">
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/my-orders'); setIsOpen(false); }}
                  className="text-left py-3 text-gray-700 hover:text-purple-600 border-b border-gray-100 font-medium transition">
                  Commandes
                </button>
                {isAdmin && (
                  <button onClick={() => { navigate('/admin/dashboard'); setIsOpen(false); }}
                    className="text-left py-3 text-gray-700 hover:text-purple-600 border-b border-gray-100 font-medium transition">
                    Admin
                  </button>
                )}
                <button onClick={handleLogout}
                  className="text-left py-3 text-red-600 hover:text-red-800 font-medium transition">
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}