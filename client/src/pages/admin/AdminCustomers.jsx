import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../../services';

export function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers({ limit: 50 });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => ({
    admin: 'bg-purple-50 text-purple-700 border border-purple-200',
    client: 'bg-blue-50 text-blue-700 border border-blue-200',
  }[role] || 'bg-gray-100 text-gray-800');

  const getRoleLabel = (role) => ({
    admin: 'Administrateur',
    client: 'Client',
  }[role] || role);

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">Clients</h1>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-purple-100 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200 bg-purple-50">
                  {['Nom', 'Email', 'Téléphone', 'Gouvernorat', 'Rôle', 'Inscription'].map(h => (
                    <th key={h} className="text-left py-4 px-4 text-sm font-semibold text-purple-900">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-purple-100 hover:bg-purple-50 transition">
                    <td className="py-4 px-4 font-semibold text-gray-900">{user.full_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{user.phone}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{user.wilaya}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold inline-block ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="text-center py-12 text-gray-600">Aucun client trouvé</div>}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun client trouvé</p>
            ) : users.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow border border-purple-100 p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getRoleBadge(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{user.phone} {user.wilaya ? `· ${user.wilaya}` : ''}</span>
                  <span>{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button key={page}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${pagination.page === page ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}