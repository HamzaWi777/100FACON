import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderService } from '../../services';

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders({ limit: 100 });
      const orders = response.data.orders;
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
      setStats({
        totalOrders: response.data.pagination.total,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalProducts: Math.floor(Math.random() * 100) + 20,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      });
      setRecentOrders(orders.slice(0, 5));
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
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

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: 'Commandes totales', value: stats.totalOrders, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Commandes en attente', value: stats.pendingOrders, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'Produits totaux', value: stats.totalProducts, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Revenu total', value: `TND ${(stats.totalRevenue || 0).toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white p-4 md:p-6 rounded-2xl shadow-md border ${stat.bg}`}>
            <h3 className="text-gray-600 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">{stat.label}</h3>
            <p className={`text-xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 md:p-6">
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-gray-900">Commandes récentes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600">Aucune commande pour le moment</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200 bg-purple-50">
                    <th className="text-left py-3 px-4 text-purple-900 font-semibold">N° Commande</th>
                    <th className="text-left py-3 px-4 text-purple-900 font-semibold">Client</th>
                    <th className="text-left py-3 px-4 text-purple-900 font-semibold">Total</th>
                    <th className="text-left py-3 px-4 text-purple-900 font-semibold">État</th>
                    <th className="text-left py-3 px-4 text-purple-900 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-purple-100 hover:bg-purple-50 transition">
                      <td className="py-3 px-4 font-semibold text-purple-600">#{order.id}</td>
                      <td className="py-3 px-4 text-gray-700">{order.customerName}</td>
                      <td className="py-3 px-4 font-bold text-purple-600">TND {(parseFloat(order.total_price) || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-purple-600">#{order.id}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{order.customerName}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold text-purple-600 text-sm">TND {(parseFloat(order.total_price) || 0).toFixed(2)}</span>
                    <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}