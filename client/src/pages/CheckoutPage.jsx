import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService, orderService } from '../services';
import { useAuth } from '../context/AuthContext';
import { governorates } from '../constants/governorates';
import { trackInitiateCheckout, trackPurchase } from '../utils/metaPixel';
import { imgSrc } from '../utils/imgSrc';

function CheckoutPageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: user?.address || '',
    phone: user?.phone || '',
    wilaya: user?.wilaya || '',
    notes: '',
    // Guest fields
    ...(isGuest && {
      full_name: '',
      email: '',
    }),
  });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      const totalPrice = cartItems.reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return sum + price * item.quantity;
      }, 0);
      trackInitiateCheckout({
        value: totalPrice + 8.00,
        currency: 'TND',
        contentIds: cartItems.map((item) => item.product_id),
        numItems: cartItems.length,
      });
    }
  }, [cartItems]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      if (isGuest) {
        // For guests, cart would be stored in localStorage or via session ID
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        setCartItems(guestCart);
      } else {
        const response = await cartService.getCart();
        setCartItems(response.data);
      }
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        ...formData,
        // Add guest info and cart items if guest
        ...(isGuest && {
          guest_name: formData.full_name,
          guest_email: formData.email,
          cartItems: cartItems, // Send cart items in request body for guests
        }),
      };

      const response = await orderService.createOrder(orderData);
      const orderId = response.data.orderId;
      const totalPrice = response.data.totalPrice;

      trackPurchase({
        orderId,
        value: totalPrice + 8.00,
        currency: 'TND',
        contentIds: cartItems.map((item) => item.product_id),
        numItems: cartItems.length,
      });

      toast.success('Order placed successfully!');
      
      // Clear guest cart
      if (isGuest) {
        localStorage.removeItem('guestCart');
        localStorage.removeItem('guestSessionId');
      }
      
      navigate(`/`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">Votre panier est vide</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-semibold"
        >
          Continuer vos achats
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Finaliser votre commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 font-serif">Récapitulatif de la commande</h2>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-purple-100 last:border-b-0">
                   {item.images?.[0] && (
                     <img
                       src={imgSrc(item.images[0])}
                       alt={item.name}
                       loading="lazy"
                       decoding="async"
                       className="w-24 h-24 object-cover rounded-lg"
                     />
                   )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.size} | {item.color} | Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-right font-semibold text-purple-600">
                    TND {((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t-2 border-purple-200">
              <div className="flex justify-between text-gray-700">
                <span>Sous-total:</span>
                <span className="font-semibold">TND {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Livraison:</span>
                <span className="text-green-600 font-semibold">TND 8.00</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-purple-200 text-purple-600">
                <span>Total:</span>
                <span>TND {(totalPrice + 8.00).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 h-fit">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 font-serif">Informations de livraison</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isGuest ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email (Optionnel)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Adresse *
              </label>
              <textarea
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Gouvernorat *
              </label>
              <select
                name="wilaya"
                value={formData.wilaya}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionnez un gouvernorat</option>
                {governorates.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notes additionnelles (Optionnel)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Instructions spéciales, préférences de livraison..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-base"
            >
              {submitting ? 'Traitement en cours...' : 'Confirmer la commande'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full border-2 border-purple-300 py-3 rounded-lg hover:bg-purple-50 transition text-purple-600 font-semibold"
            >
              Retour au panier
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPageContent;

