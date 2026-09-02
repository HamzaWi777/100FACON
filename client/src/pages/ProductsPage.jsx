import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services';
import { imgSrc } from '../utils/imgSrc';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filter drawer
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const categories = ['all', 'men', 'women', 'accessories', 'shoes', 'enfants', 'matchy_matchy'];
  const categoryLabels = {
    all: 'Tous', men: 'Hommes', women: 'Femmes',
    accessories: 'Accessoires', shoes: 'Chaussures', enfants: 'Enfants',
    matchy_matchy: 'Matchy Matchy',
  };

  useEffect(() => { fetchProducts(); }, [filters, searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 12,
        category: filters.category !== 'all' ? filters.category : '',
        minPrice: filters.minPrice || '',
        maxPrice: filters.maxPrice || '',
        search: filters.search || '',
        sort: filters.sort,
      };
      const response = await productService.getAll(params);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Échec du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    const newParams = new URLSearchParams(searchParams);
    value ? newParams.set(key, value) : newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  const activeFilterCount = [
    filters.category !== 'all',
    filters.minPrice,
    filters.maxPrice,
    filters.sort !== 'newest',
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100">
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-900">Catégorie</h3>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{categoryLabels[cat]}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-900">Fourchette de prix</h3>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-semibold mb-3 text-gray-900">Trier par</h3>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="newest">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-gray-900">
        Collection complète
      </h1>

      {/* Search bar — always visible */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher des produits..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Mobile: filter toggle button */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <p className="text-sm text-gray-500">{products.length} produit(s)</p>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border border-purple-300 bg-purple-50 px-4 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-100 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtres
          {activeFilterCount > 0 && (
            <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: collapsible filter panel */}
      {filtersOpen && (
        <div className="md:hidden mb-4">
          <FilterPanel />
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <FilterPanel />
        </aside>

        {/* Product grid */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <p className="text-lg">Aucun produit trouvé</p>
              <p className="text-sm">Essayez d'ajuster vos filtres</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8">
                {products.map(product => (
                   <div
                     key={product.id}
                     onClick={() => navigate(`/product/${product.id}`)}
                     className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer hover:-translate-y-1 product-grid-item"
                  >
                    <div className="relative overflow-hidden bg-gray-100 h-44 sm:h-64 md:h-96">
                      {product.images[0] && (
                        <img
                          src={imgSrc(product.images[0], { width: 640 })}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 767px) 50vw, 33vw"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="text-white font-bold">Rupture</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2 line-clamp-1 text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 hidden sm:block">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-sm md:text-xl font-bold text-purple-600">
                          TND {product.price.toFixed(2)}
                        </span>
                        {product.stock > 0 && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                            En stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center flex-wrap gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        pagination.page === page
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}