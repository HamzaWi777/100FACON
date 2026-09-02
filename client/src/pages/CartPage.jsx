import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../services';
import { useAuth } from '../context/AuthContext';
import { 
  getGuestCart, 
  updateGuestCartItem, 
  removeFromGuestCart 
} from '../utils/guestCart';
import { imgSrc } from '../utils/imgSrc';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const guestCart = getGuestCart();
        setCartItems(guestCart);
      } else {
        const response = await cartService.getCart();
        setCartItems(response.data);
      }
    } catch (error) {
      toast.error('Échec du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      if (isGuest) {
        const updated = updateGuestCartItem(itemId, newQuantity);
        setCartItems(updated);
      } else {
        await cartService.updateCartItem(itemId, { quantity: newQuantity });
        setCartItems(cartItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ));
      }
      toast.success('Panier mis à jour');
    } catch (error) {
      toast.error('Échec de la mise à jour du panier');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      if (isGuest) {
        const updated = removeFromGuestCart(itemId);
        setCartItems(updated);
      } else {
        await cartService.removeFromCart(itemId);
        setCartItems(cartItems.filter(item => item.id !== itemId));
      }
      toast.success('Article retiré du panier');
    } catch (error) {
      toast.error("Échec de la suppression de l'article");
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Panier</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <div className="text-6xl mb-4">🛍️</div>
          <p className="text-gray-600 mb-6 text-lg">Votre panier est vide</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-full hover:from-purple-700 hover:to-purple-800 transition font-semibold shadow-lg"
          >
            Continuer les achats
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles du panier */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl shadow-md border border-purple-100 hover:shadow-lg transition flex gap-4"
                >
                    {item.images[0] && (
                      <img
                        src={imgSrc(item.images[0])}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
                      />
                    )}

                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-base sm:text-lg text-gray-900 break-words">{item.name} <span className="text-xs text-gray-500 font-normal">({item.size?.startsWith('adult_') ? 'Adulte' : item.size?.startsWith('enfant_') ? 'Enfant' : 'Unique'})</span></h3>
                       <p className="text-sm text-gray-600">
                         Taille : {item.size?.replace(/^adult_|^enfant_/, '') || '-'} | Couleur : {item.color}
                       </p>
                      <p className="text-base sm:text-lg font-bold text-purple-600 mt-2">
                        TND {(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-purple-200 rounded transition font-semibold"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center px-2 py-1 bg-gray-100 border-0 font-semibold"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-purple-200 rounded transition font-semibold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800 font-semibold ml-auto"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      TND {((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif de commande */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-md border border-purple-100 sticky top-20">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Récapitulatif</h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-purple-200">
                <div className="flex justify-between text-gray-700">
                  <span>Sous-total :</span>
                  <span className="font-semibold">TND {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Livraison :</span>
                  <span className="font-semibold text-green-600">TND 8.00</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-bold mb-6 text-purple-600">
                <span>Total :</span>
                <span>TND {(totalPrice + 8.00).toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-full hover:from-purple-700 hover:to-purple-800 transition font-semibold shadow-lg hover:shadow-xl"
              >
                Passer la commande
              </button>

              <button
                onClick={() => navigate('/products')}
                className="w-full mt-3 border-2 border-purple-300 text-purple-600 py-3 rounded-full hover:bg-purple-50 transition font-semibold"
              >
                Continuer les achats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;