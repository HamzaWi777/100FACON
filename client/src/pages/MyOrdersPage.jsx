import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../services';
import { PrivateRoute } from '../components/ProtectedRoute';
import { imgSrc } from '../utils/imgSrc';

function MyOrdersPageContent() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getUserOrders();
      setOrders(response.data);
      if (orderId) {
        const order = response.data.find(o => o.id === parseInt(orderId));
        if (order) {
          fetchOrderDetails(order.id);
        }
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const response = await orderService.getOrderDetails(id);
      setSelectedOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
      shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
      delivered: 'bg-green-50 text-green-700 border border-green-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
          <p className="text-gray-600 mb-6 text-lg">Vous n'avez pas encore passé de commandes</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-semibold"
          >
            Commencer vos achats
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-purple-100">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Vos commandes</h2>
              <div className="space-y-2">
                {orders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => fetchOrderDetails(order.id)}
                    className={`w-full p-4 rounded-lg text-left transition ${
                      selectedOrder?.id === order.id
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                        : 'bg-gray-50 hover:bg-purple-50 text-gray-900'
                    }`}
                  >
                    <p className="font-semibold">Commande #{order.id}</p>
                    <p className={`text-sm opacity-75 ${selectedOrder?.id === order.id ? 'text-purple-100' : 'text-gray-600'}`}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    <p className={`text-sm font-semibold mt-2 ${selectedOrder?.id === order.id ? 'text-purple-100' : 'text-purple-600'}`}>
                      TND {(parseFloat(order.total_price) || 0).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
                <h2 className="font-serif text-2xl font-bold mb-6 text-gray-900">Commande #{selectedOrder.id}</h2>

                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b-2 border-purple-200">
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900">État de la commande</h3>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold inline-block ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900">Date</h3>
                    <p className="text-gray-600">{new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b-2 border-purple-200">
                  <h3 className="font-semibold mb-3 text-gray-900">Adresse de livraison</h3>
                  <p className="text-gray-600 mb-2">{selectedOrder.shipping_address}</p>
                  <p className="text-gray-600">{selectedOrder.wilaya} | {selectedOrder.phone}</p>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6 pb-6 border-b-2 border-purple-200">
                    <h3 className="font-semibold mb-2 text-gray-900">Notes</h3>
                    <p className="text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-4 text-gray-900">Articles de la commande</h3>
                  <div className="space-y-4 mb-6">
                    {selectedOrder.items?.map(item => (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-purple-100 last:border-b-0"
                      >
                        {item.images[0] && (
                          <img
                            src={imgSrc(item.images[0])}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                         <div className="flex-1">
                           <p className="font-semibold text-gray-900">
                             {item.name}
                             <span className="text-xs text-gray-500 font-normal ml-1">
                               ({item.size?.startsWith('adult_') ? 'Adulte' : item.size?.startsWith('enfant_') ? 'Enfant' : 'Unique'})
                             </span>
                           </p>
                           <p className="text-sm text-gray-600">
                             {item.size?.replace(/^adult_|^enfant_/, '') || '-'} | {item.color} | Qté: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-600">
                            TND {(parseFloat(item.price) || 0).toFixed(2)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Total: TND {((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-purple-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-purple-600">
                      <span>Total:</span>
                      <span>TND {(parseFloat(selectedOrder.total_price) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-purple-100">
                <p className="text-gray-600 text-lg">Sélectionnez une commande pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <PrivateRoute>
      <MyOrdersPageContent />
    </PrivateRoute>
  );
}
