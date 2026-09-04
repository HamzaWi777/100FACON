import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../../services';

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders({ status: statusFilter, limit: 100 });
      setOrders(response.data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      setSelectedOrder(null);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
    shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
    delivered: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
  }[status] || 'bg-gray-100 text-gray-800');

  const getStatusLabel = (status) => ({
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }[status] || status);

  const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const OrderDetailPanel = ({ order, onClose }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
      <h2 className="font-serif text-2xl font-bold mb-6 text-gray-900">Commande #{order.id}</h2>
      <div className="space-y-4 mb-6">
        {[
          { label: 'Client', value: order.customerName },
          { label: 'Email', value: order.customerEmail },
          { label: 'Téléphone', value: order.phone },
          { label: 'Gouvernorat', value: order.wilaya },
          { label: 'Adresse de livraison', value: order.shipping_address },
          { label: 'Note', value: order.notes },
        ].map(f => f.value && (
          <div key={f.label}>
            <p className="text-gray-500 text-xs font-semibold uppercase">{f.label}</p>
            <p className="font-medium text-sm text-gray-900">{f.value}</p>
          </div>
        ))}
        <div className="pt-2 border-t border-purple-200">
          <p className="text-gray-500 text-xs font-semibold uppercase">Montant total</p>
          <p className="font-bold text-lg text-purple-600">TND {(parseFloat(order.total_price) || 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-semibold mb-3 uppercase">Articles ({order.itemsCount})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-gray-600">Qté: {item.quantity} × TND {parseFloat(item.price).toFixed(2)}</p>
                {(item.size || item.color) && (
                  <p className="text-gray-500 text-xs mt-1">
                    {item.size && `Taille: ${item.size.replace(/^adult_|^enfant_/, '')}`} {item.color && `| Couleur: ${item.color}`}
                    {item.voilee && <span className="ml-1 text-purple-700 font-medium">🧕 Voilée</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b-2 border-purple-200">
        <label className="block text-sm font-semibold mb-3 text-gray-900">Mettre à jour l'état</label>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(order.id, e.target.value)}
          className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
        >
          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      <button onClick={onClose} className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition text-purple-600 font-medium text-sm">
        Fermer
      </button>
    </div>
  );

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Gestion des commandes</h1>

      {/* Status filter — scrollable on mobile */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 md:px-6 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap flex-shrink-0 ${
              statusFilter === status 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {status === 'all' ? 'Toutes' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders list */}
          <div className="lg:col-span-2">
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-purple-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200 bg-purple-50">
                    <th className="text-left py-4 px-4 text-purple-900 font-semibold">N° Commande</th>
                    <th className="text-left py-4 px-4 text-purple-900 font-semibold">Client</th>
                    <th className="text-left py-4 px-4 text-purple-900 font-semibold">Total</th>
                    <th className="text-left py-4 px-4 text-purple-900 font-semibold">État</th>
                    <th className="text-left py-4 px-4 text-purple-900 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`border-b border-purple-100 hover:bg-purple-50 cursor-pointer transition ${selectedOrder?.id === order.id ? 'bg-purple-100' : ''}`}
                    >
                      <td className="py-4 px-4 font-semibold text-purple-600">#{order.id}</td>
                      <td className="py-4 px-4 text-gray-900">{order.customerName}</td>
                      <td className="py-4 px-4 font-bold text-purple-600">TND {(parseFloat(order.total_price) || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition ${
                    selectedOrder?.id === order.id ? 'border-purple-600 bg-purple-50' : 'border-purple-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-purple-600">#{order.id}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  <div className="flex justify-between mt-3">
                    <span className="font-bold text-purple-600">TND {(parseFloat(order.total_price) || 0).toFixed(2)}</span>
                    <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2 font-medium">Tap pour gérer →</p>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-gray-600 py-8">Aucune commande trouvée</p>}
            </div>
          </div>

          {/* Desktop: sidebar panel */}
          <div className="hidden lg:block lg:col-span-1">
            {selectedOrder
              ? <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
              : <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-purple-100"><p className="text-gray-600">Sélectionnez une commande pour voir les détails</p></div>
            }
          </div>
        </div>
      )}

      {/* Mobile: full-screen modal */}
      {selectedOrder && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto p-4">
            <div className="w-10 h-1 bg-purple-300 rounded mx-auto mb-4" />
            <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
          </div>
        </div>
      )}
    </div>
  );
}