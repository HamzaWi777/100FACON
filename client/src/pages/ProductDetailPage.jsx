import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService, cartService } from '../services';
import { useAuth } from '../context/AuthContext';
import { addToGuestCart, getOrCreateGuestSessionId } from '../utils/guestCart';
import { trackViewContent, trackAddToCart } from '../utils/metaPixel';
import { imgSrc, preloadImages } from '../utils/imgSrc';

// Sliding carousel with live finger-drag and snap-to-slide transitions.
// Uses imperative DOM transforms during drag to avoid React re-renders
// on every touchmove, preventing jank when scrolling through many images.
function useSwipeCarousel(length) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentIndex = useRef(0);
  const lastDelta = useRef(0);
  const swiped = useRef(false);

  const applyTransform = (slideIndex, withTransition = false) => {
    const el = containerRef.current;
    if (!el || !length) return;
    el.style.transition = withTransition ? 'transform 0.3s ease-out' : 'none';
    el.style.transform = `translate3d(${-slideIndex * 100}%, 0, 0)`;
  };

  const go = (delta) => {
    if (!length) return;
    const newIndex = (currentIndex.current + delta + length) % length;
    applyTransform(newIndex, true);
    currentIndex.current = newIndex;
    setIndex(newIndex);
  };

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    lastDelta.current = 0;
    swiped.current = false;
    if (containerRef.current) containerRef.current.style.transition = 'none';
  };

  const onTouchMove = (e) => {
    const el = containerRef.current;
    if (!el || !length) return;
    const delta = e.touches[0].clientX - startX.current;
    lastDelta.current = delta;
    const pct = delta / el.offsetWidth;
    el.style.transform = `translate3d(${(currentIndex.current + -pct) * -100}%, 0, 0)`;
  };

  const onTouchEnd = () => {
    if (!length) return;
    if (Math.abs(lastDelta.current) > 50) {
      const newIndex = (currentIndex.current + (lastDelta.current > 0 ? -1 : 1) + length) % length;
      applyTransform(newIndex, true);
      currentIndex.current = newIndex;
      setIndex(newIndex);
      swiped.current = true;
    } else {
      applyTransform(currentIndex.current, true);
    }
  };

  const syncedSetIndex = (newIndex) => {
    if (!length) return;
    const clamped = ((newIndex % length) + length) % length;
    applyTransform(clamped, true);
    currentIndex.current = clamped;
    setIndex(clamped);
  };

  return { index, setIndex: syncedSetIndex, go, containerRef, onTouchStart, onTouchMove, onTouchEnd, swiped };
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbVisible, setLbVisible] = useState(false);
  const pageCarousel = useSwipeCarousel(product?.images?.length || 0);
  const lightboxCarousel = useSwipeCarousel(product?.images?.length || 0);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productService.getById(id);
      const data = response.data;
      setProduct(data);
      if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
      if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
      trackViewContent({ id: data.id, name: data.name, price: data.price });
    } catch {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
     if (product?.images?.length) preloadImages(product.images);
   }, [product]);

   const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    const variantKey = `${selectedSize}_${selectedColor}`;
    if ((product.variants?.[variantKey] || 0) === 0) {
      toast.error('This size and color combination is out of stock');
      return;
    }
    try {
      if (isAuthenticated) {
        await cartService.addToCart({ product_id: product.id, quantity, size: selectedSize, color: selectedColor });
      } else {
        getOrCreateGuestSessionId();
        addToGuestCart(product, quantity, selectedSize, selectedColor);
      }
      trackAddToCart({ id: product.id, name: product.name, price: product.price, quantity });
      toast.success('Added to cart');
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add to cart');
    }
  };

  const getVariantStock = () => {
    if (!product?.variants) return 0;
    return product.variants[`${selectedSize}_${selectedColor}`] || 0;
  };

  const currentVariantStock = product ? getVariantStock() : 0;


  // ── Lightbox ──
  const openLightbox = (index) => {
    lightboxCarousel.setIndex(index);
    setLightboxOpen(true);
    requestAnimationFrame(() => setLbVisible(true));
  };

  const closeLightbox = () => {
    setLbVisible(false);
    setTimeout(() => setLightboxOpen(false), 300);
  };

  // Keyboard + body scroll lock while open
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lightboxCarousel.go(-1);
      else if (e.key === 'ArrowRight') lightboxCarousel.go(1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  // Preload neighbouring images for smooth navigation
  useEffect(() => {
    if (!lightboxOpen || !product?.images?.length) return;
    const len = product.images.length;
    const neighbors = [
      product.images[(lightboxCarousel.index - 1 + len) % len],
      product.images[(lightboxCarousel.index + 1) % len],
    ];
    preloadImages(neighbors);
  }, [lightboxCarousel.index, lightboxOpen]);


  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen text-gray-600">Produit non trouvé</div>;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <button
        onClick={() => navigate('/products')}
        className="text-purple-600 hover:text-purple-700 mb-4 md:mb-6 flex items-center gap-1 text-sm md:text-base font-medium transition"
      >
        ← Retour à la collection
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

        {/* ── Image Gallery ── */}
        <div>
          {product.images.length > 0 ? (
            <>
              {/* Sliding gallery + external navigation */}
              <div className="relative overflow-hidden rounded-2xl shadow-lg mb-4">
                 <div
                   ref={pageCarousel.containerRef}
                   className="flex will-change-transform"
                   onTouchStart={pageCarousel.onTouchStart}
                   onTouchMove={pageCarousel.onTouchMove}
                   onTouchEnd={pageCarousel.onTouchEnd}
                 >
                   {product.images.map((img, idx) => (
                     <div key={idx} className="w-full flex-shrink-0">
                       <img
                         src={imgSrc(img)}
                         alt={`${product.name} - image ${idx + 1}`}
                         onClick={() => {
                           if (pageCarousel.swiped.current) { pageCarousel.swiped.current = false; return; }
                           openLightbox(idx);
                         }}
                         loading={idx === pageCarousel.index ? 'eager' : 'lazy'}
                         decoding="async"
                         className="w-full h-72 sm:h-[480px] md:h-[600px] object-cover cursor-zoom-in select-none"
                         draggable={false}
                       />
                    </div>
                  ))}
                </div>
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => pageCarousel.go(-1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-purple-700 shadow transition"
                      aria-label="Photo précédente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => pageCarousel.go(1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-purple-700 shadow transition"
                      aria-label="Photo suivante"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails — horizontal scroll on mobile */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                   {product.images.map((img, idx) => (
                     <img
                       key={idx}
                       src={imgSrc(img)}
                       alt={`thumbnail-${idx}`}
                       loading="lazy"
                       decoding="async"
                       onClick={() => pageCarousel.setIndex(idx)}
                      className={`w-16 h-20 md:w-20 md:h-28 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 transition ${
                        pageCarousel.index === idx ? 'border-purple-600' : 'border-gray-300 hover:border-purple-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-72 md:h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
              Pas d'image disponible
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900">
            {product.name}
          </h1>
          <p className="text-gray-600 mb-6 md:mb-8 whitespace-pre-wrap text-sm md:text-base leading-relaxed">
            {product.description}
          </p>

          {/* Price + stock */}
          <div className="flex flex-wrap items-baseline gap-4 mb-8 md:mb-10 pb-6 border-b border-purple-200">
            <span className="text-3xl md:text-4xl font-bold text-purple-600">
              TND {product.price.toFixed(2)}
            </span>
            <span className={`text-sm md:text-base font-semibold ${product.stock > 0 ? 'text-green-600 bg-green-50 px-3 py-1 rounded-full' : 'text-red-600 bg-red-50 px-3 py-1 rounded-full'}`}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
            </span>
          </div>

          <div className="space-y-6 mb-8">

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div>
                <label className="block font-semibold mb-3 text-gray-900">Taille</label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(size => {
                    const sizeStock = Object.entries(product.variants || {}).reduce(
                      (sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0
                    );
                    const oos = sizeStock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(size); setQuantity(1); }}
                        disabled={oos}
                        title={oos ? 'En rupture' : `${sizeStock} en stock`}
                        className={`px-4 py-2 border-2 rounded-lg transition font-medium ${
                          selectedSize === size
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600'
                            : oos
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-purple-200 hover:border-purple-400 text-gray-900'
                        }`}
                      >
                        {size}{oos && <span className="text-xs ml-1">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color */}
            {product.colors?.length > 0 && (
              <div>
                <label className="block font-semibold mb-3 text-gray-900">Couleur</label>
                <select
                  value={selectedColor}
                  onChange={(e) => { setSelectedColor(e.target.value); setQuantity(1); }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  {product.colors.map(color => {
                    const colorStock = Object.entries(product.variants || {}).reduce(
                      (sum, [key, stock]) => key.endsWith('_' + color) ? sum + stock : sum, 0
                    );
                    return (
                      <option key={color} value={color} disabled={colorStock === 0}>
                        {color} {colorStock === 0 ? '(Rupture)' : `(${colorStock} disponibles)`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Variant stock status */}
            <div className={`p-4 rounded-xl text-sm font-medium ${
              currentVariantStock > 0
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {currentVariantStock > 0
                ? `✓ ${currentVariantStock} disponible(s) — taille ${selectedSize}, couleur ${selectedColor}`
                : '✕ Cette combinaison taille/couleur est en rupture de stock'}
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold mb-3 text-gray-900">Quantité</label>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
                  min="1"
                  max={currentVariantStock}
                />
                <button
                  onClick={() => setQuantity(Math.min(currentVariantStock, quantity + 1))}
                  className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Sticky CTA on mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-purple-200 md:static md:p-0 md:border-0 md:bg-transparent z-40 shadow-2xl md:shadow-none">
            <button
              onClick={handleAddToCart}
              disabled={currentVariantStock === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-base md:text-lg shadow-lg hover:shadow-xl"
            >
              {currentVariantStock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
            </button>
          </div>

          {/* Spacer so content isn't hidden behind the sticky bar on mobile */}
          <div className="h-24 md:h-0" />
        </div>
      </div>

      {lightboxOpen && (
        <div
          className={`fixed inset-0 z-[60] bg-black/95 flex items-center justify-center transition-opacity duration-300 ${lbVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie d'images"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          {product.images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
              {lightboxCarousel.index + 1} / {product.images.length}
            </div>
          )}

          {/* Previous */}
          {product.images.length > 1 && (
            <button
               onClick={(e) => { e.stopPropagation(); lightboxCarousel.go(-1); }}
              className="absolute left-2 sm:left-4 z-10 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Image précédente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next */}
          {product.images.length > 1 && (
            <button
               onClick={(e) => { e.stopPropagation(); lightboxCarousel.go(1); }}
              className="absolute right-2 sm:right-4 z-10 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Image suivante"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Sliding track */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            onTouchStart={lightboxCarousel.onTouchStart}
            onTouchMove={lightboxCarousel.onTouchMove}
            onTouchEnd={lightboxCarousel.onTouchEnd}
          >
            <div
              ref={lightboxCarousel.containerRef}
              className="flex w-full h-full will-change-transform"
            >
              {product.images.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center px-2">
                   <img
                     src={imgSrc(img)}
                     alt={`${product.name} - image ${idx + 1}`}
                     onClick={(e) => e.stopPropagation()}
                     loading={idx === lightboxCarousel.index ? 'eager' : 'lazy'}
                     decoding="async"
                    className="max-w-[92vw] max-h-[82vh] sm:max-w-[90vw] sm:max-h-[90vh] object-contain select-none cursor-default"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}