import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services';
import coverImg from '../assets/hero-cover.jpg';
import coverImgMobile from '../assets/hero-cover-mobile.jpg';

// ...

export function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll({ limit: 6 });
      setFeaturedProducts(response.data.products.slice(0, 6));
    } catch (error) {
      console.error('Échec du chargement des produits vedettes');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Femmes', icon: '👗', link: '/products?category=women' },
    { name: 'Hommes', icon: '👔', link: '/products?category=men' },
    { name: 'Accessoires', icon: '💍', link: '/products?category=accessories' },
    { name: 'Chaussures', icon: '👠', link: '/products?category=shoes' },
  ];

  return (
    
    <div>

<section className="relative text-white h-72 sm:h-80 md:h-auto">
  {/* Mobile background */}
  <div
    className="absolute inset-0 bg-cover bg-center md:hidden"
    style={{ backgroundImage: `url(${coverImgMobile})` }}
  />
  {/* Desktop background */}
  <div
    className="hidden md:block absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${coverImg})` }}
  />

  <div className="absolute inset-0 bg-black/20" />

  <div className="relative container mx-auto px-4 text-center h-full flex items-center justify-center md:block md:py-40">
    <button
      onClick={() => navigate('/products')}
      className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-purple-50 transition text-sm sm:text-base shadow-lg hover:shadow-xl"
    >
      Commencer à explorer
    </button>
  </div>
</section>

      {/* Categories Section */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">
            Collections
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => navigate(category.link)}
                className="group bg-gradient-to-br from-purple-50 to-pink-50 p-6 md:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all hover:scale-105 text-center border border-purple-100"
              >
                <div className="text-5xl md:text-6xl mb-4 transition-transform group-hover:scale-110" style={{ filter: 'hue-rotate(42deg) saturate(1.5)' }}>
                  {category.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-purple-900 group-hover:text-purple-600 transition">
                  {category.name}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-14 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-gray-900">
              Coup de cœur
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Nos produits les plus tendance cette saison
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {featuredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 text-left"
                >
                  <div className="relative overflow-hidden bg-gray-100 h-48 sm:h-64 md:h-96">
                    {product.images[0] && (
                      <img
                        src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Rupture</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="font-semibold text-sm md:text-lg mb-2 line-clamp-1 text-gray-900">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-4 hidden sm:block">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-lg md:text-2xl font-bold text-purple-600">
                        TND {product.price.toFixed(2)}
                      </span>
                      {product.stock > 0 && (
                        <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          En stock
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 md:px-10 py-3 rounded-full font-bold hover:from-purple-700 hover:to-purple-800 transition shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              Voir toute la collection
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900">
            Pourquoi 100 FAÇONS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
            {[
              { icon: '🚚', title: 'Livraison rapide', desc: 'Partout en Tunisie en 24-48h' },
              { icon: '🛡️', title: 'Sécurité garantie', desc: 'Paiement 100% sécurisé et protégé' },
              { icon: '💬', title: 'Service premium', desc: 'Support client dédié 24/7' },
            ].map(item => (
              <div key={item.title} className="text-center p-6 md:p-8 rounded-2xl border border-purple-100 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-transparent transition">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-14 md:py-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Restez connectée
          </h2>
          <p className="text-center text-purple-100 mb-8 text-sm md:text-base">
            Abonnez-vous à notre newsletter pour recevoir les dernières tendances et offres exclusives
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Votre email..."
              className="flex-1 min-w-0 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-purple-50 transition whitespace-nowrap w-full sm:w-auto">
              S'abonner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}