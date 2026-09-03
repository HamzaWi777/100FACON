import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService, cartService } from '../services';
import { useAuth } from '../context/AuthContext';
import { addToGuestCart, getOrCreateGuestSessionId } from '../utils/guestCart';
import { trackViewContent, trackAddToCart } from '../utils/metaPixel';
import { imgSrc, preloadImages } from '../utils/imgSrc';
import { ColorSwatches } from '../components/ColorSwatches';

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

function MatchyMatchyForm({
  product,
  adultSize, setAdultSize,
  adultColor, setAdultColor,
  adultQty, setAdultQty,
  enfantSize, setEnfantSize,
  enfantColor, setEnfantColor,
   enfantQty, setEnfantQty,
  selectionMode, setSelectionMode,
}) {
  const variants = product.variants || {};
  const colorDisplay = (color) => {
    const adultStock = Object.entries(variants).filter(([k]) => k.startsWith('adult_') && k.endsWith('_' + color)).reduce((s, [, v]) => s + v, 0);
    return `${color} ${adultStock === 0 ? '(Rupture)' : `(${adultStock} disponibles)`}`;
  };
  return (
    <div className="space-y-6 mb-8">
      {/* Mode selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => selectionMode !== 'adult' && setSelectionMode('adult')}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            selectionMode === 'adult'
              ? 'bg-purple-700 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Adulte
        </button>
        <button
          onClick={() => selectionMode !== 'enfant' && setSelectionMode('enfant')}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            selectionMode === 'enfant'
              ? 'bg-pink-600 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Enfant
        </button>
        <button
          onClick={() => selectionMode !== 'both' && setSelectionMode('both')}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            selectionMode === 'both'
              ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Les deux
        </button>
      </div>

      {/* ── Adulte ── */}
      {(selectionMode === 'adult' || selectionMode === 'both') && (
      <>
        <div>
          <label className="block font-semibold mb-3 text-gray-900">Taille Adulte</label>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map(size => {
              const sizeStock = Object.entries(variants).reduce(
                (sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0
              );
              const oos = sizeStock === 0;
              return (
                <button
                  key={size}
                  onClick={() => setAdultSize(size)}
                  disabled={oos}
                  title={oos ? 'En rupture' : `en stock`}
                  className={`px-4 py-2 border-2 rounded-lg transition font-medium ${
                    adultSize === size
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600'
                      : oos
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-purple-200 hover:border-purple-400 text-gray-900'
                  }`}
                >
                  {size.replace('adult_', '')}{oos && <span className="text-xs ml-1">✕</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-3 text-gray-900">Couleur Adulte</label>
          <ColorSwatches
            colors={product.colors}
            value={adultColor}
                    onChange={(color) => selectColorAndImage(color, product.colors, setAdultColor)}
            getStock={(color) => adultSize ? variants[`${adultSize}_${color}`] || 0 : 0}
            name="Couleur adulte"
          />
        </div>

        <div>
          <label className="block font-semibold mb-3 text-gray-900">Quantité (Adulte)</label>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
            <button onClick={() => setAdultQty(Math.max(1, adultQty - 1))} className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600">−</button>
            <input
              type="number"
              value={adultQty}
              onChange={(e) => setAdultQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
              min="1"
              max={variants[`${adultSize}_${adultColor}`] || 1}
            />
            <button
              onClick={() => {
                const max = variants[`${adultSize}_${adultColor}`] || 1;
                setAdultQty(Math.min(max, adultQty + 1));
              }}
              className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600"
            >+</button>
          </div>
        </div>
      </>)
    }

      {/* ── Enfant ── */}
      {(selectionMode === 'enfant' || selectionMode === 'both') && (
      <>
        <div className="border-t border-purple-200 pt-4">
        <label className="block font-semibold mb-3 text-gray-900">Taille Enfant</label>
        <div className="flex gap-2 flex-wrap">
          {(product.enfant_sizes || []).map(size => {
            const sizeStock = Object.entries(variants).reduce(
              (sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0
            );
            const oos = sizeStock === 0;
            return (
              <button
                key={size}
                onClick={() => setEnfantSize(size)}
                disabled={oos}
                title={oos ? 'En rupture' : `${sizeStock} en stock`}
                className={`px-4 py-2 border-2 rounded-lg transition font-medium ${
                  enfantSize === size
                    ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white border-pink-600'
                    : oos
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-pink-200 hover:border-pink-400 text-gray-900'
                }`}
              >
                {size.replace('enfant_', '')}{oos && <span className="text-xs ml-1">✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-3 text-gray-900">Couleur Enfant</label>
        <ColorSwatches
          colors={product.enfant_colors || product.colors}
          value={enfantColor}
          onChange={(color) => selectColorAndImage(color, product.enfant_colors || product.colors, setEnfantColor)}
          getStock={(color) => enfantSize ? variants[`${enfantSize}_${color}`] || 0 : 0}
          name="Couleur enfant"
        />
      </div>

      <div>
        <label className="block font-semibold mb-3 text-gray-900">Quantité (Enfant)</label>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <button onClick={() => setEnfantQty(Math.max(1, enfantQty - 1))} className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600">−</button>
          <input
            type="number"
            value={enfantQty}
            onChange={(e) => setEnfantQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
            min="1"
            max={variants[`${enfantSize}_${enfantColor}`] || 1}
          />
          <button
            onClick={() => {
              const max = variants[`${enfantSize}_${enfantColor}`] || 1;
              setEnfantQty(Math.min(max, enfantQty + 1));
            }}
            className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600"
            >+</button>
          </div>
        </div>
      </>)
    }

      {/* Variant stock status */}
      <div className="p-4 rounded-xl text-sm font-medium bg-green-50 border border-green-200 text-green-800">
        {(selectionMode === 'adult' || selectionMode === 'both') && adultSize && adultColor && (
          <div>✓ Adulte: taille {adultSize.replace('adult_', '')}, couleur {adultColor} — {variants[`${adultSize}_${adultColor}`] || 0} disponible(s)</div>
        )}
        {(selectionMode === 'enfant' || selectionMode === 'both') && enfantSize && enfantColor && (
          <div>✓ Enfant: taille {enfantSize.replace('enfant_', '')}, couleur {enfantColor} — {variants[`${enfantSize}_${enfantColor}`] || 0} disponible(s)</div>
        )}
      </div>
    </div>
  );
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
  const [adultSize, setAdultSize] = useState('');
  const [adultColor, setAdultColor] = useState('');
  const [adultQty, setAdultQty] = useState(1);
  const [enfantSize, setEnfantSize] = useState('');
  const [enfantColor, setEnfantColor] = useState('');
  const [enfantQty, setEnfantQty] = useState(1);
  const [selectionMode, setSelectionMode] = useState('both');
  const pageCarousel = useSwipeCarousel(product?.images?.length || 0);
  const lightboxCarousel = useSwipeCarousel(product?.images?.length || 0);
  const carouselSyncSource = useRef(null);
  const isMM = product?.is_matchy_matchy;

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productService.getById(id);
      const data = response.data;
       setProduct(data);
        if (data.is_matchy_matchy) {
          if (data.sizes?.length > 0) setAdultSize(data.sizes[0]);
          if (data.colors?.length > 0) setAdultColor(data.colors[0]);
          if (data.enfant_sizes?.length > 0) setEnfantSize(data.enfant_sizes[0]);
          const enfantColors = data.enfant_colors || data.colors || [];
          const firstAvailEnfantColor = enfantColors.find(color => {
            const stock = Object.entries(data.variants || {}).reduce(
              (sum, [key, s]) => key.startsWith('enfant_') && key.endsWith('_' + color) ? sum + s : sum, 0
            );
            return stock > 0;
          });
          if (firstAvailEnfantColor) setEnfantColor(firstAvailEnfantColor);
          else if (enfantColors.length > 0) setEnfantColor(enfantColors[0]);
       } else {
         if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
         if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
       }
      trackViewContent({ id: data.id, name: data.name, price: data.price });
    } catch {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
     if (!product?.images?.length) return;
     const len = product.images.length;
     const neighbors = [
       product.images[(pageCarousel.index + 1) % len],
     ];
     preloadImages(neighbors, (image) => imgSrc(image, { width: 1200 }));
   }, [product, pageCarousel.index]);

   const handleAddToCart = async (mode = 'single') => {
    if (isMM) {
      const itemsToAdd = [];
      if (mode === 'adult' || mode === 'both') {
        if (adultSize && adultColor) {
          const adultKey = `${adultSize}_${adultColor}`;
          if ((product.variants?.[adultKey] || 0) > 0) {
            itemsToAdd.push({ size: adultSize, color: adultColor, quantity: adultQty, label: 'adulte' });
          } else if (mode === 'adult') {
            toast.error('La combinaison taille/couleur adulte sélectionnée est en rupture de stock');
            return;
          }
        } else if (mode === 'adult') {
          toast.error('Veuillez sélectionner une taille et couleur pour l\'adulte');
          return;
        }
      }
      if (mode === 'enfant' || mode === 'both') {
        if (enfantSize && enfantColor) {
          const enfantKey = `${enfantSize}_${enfantColor}`;
          if ((product.variants?.[enfantKey] || 0) > 0) {
            itemsToAdd.push({ size: enfantSize, color: enfantColor, quantity: enfantQty, label: 'enfant' });
          } else if (mode === 'enfant') {
            toast.error('La combinaison taille/couleur enfant sélectionnée est en rupture de stock');
            return;
          }
        } else if (mode === 'enfant') {
          toast.error('Veuillez sélectionner une taille et couleur pour l\'enfant');
          return;
        }
      }
      if (itemsToAdd.length === 0) {
        toast.error('Veuillez sélectionner au moins une taille/couleur disponible');
        return;
      }
      try {
        for (const item of itemsToAdd) {
          const itemPrice = item.label === 'adulte' ? product.price : (product.enfant_price || product.price);
          if (isAuthenticated) {
            await cartService.addToCart({ product_id: product.id, quantity: item.quantity, size: item.size, color: item.color, price: itemPrice });
          } else {
            getOrCreateGuestSessionId();
            addToGuestCart(product, item.quantity, item.size, item.color, itemPrice);
          }
        }
        trackAddToCart({ id: product.id, name: product.name, price: product.price, quantity: itemsToAdd.reduce((s, i) => s + i.quantity, 0) });
        toast.success('Article(s) ajouté(s) au panier');
        navigate('/cart', { state: { scrollToSummary: true } });
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to add to cart');
      }
      return;
    }

    // Regular (non matchy) product
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
      navigate('/cart', { state: { scrollToSummary: true } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add to cart');
    }
  };

  const getVariantStock = () => {
    if (!product?.variants) return 0;
    return product.variants[`${selectedSize}_${selectedColor}`] || 0;
  };

  const currentVariantStock = product ? getVariantStock() : 0;

  const imageIndexForColor = (colors, color) => {
    const index = colors.indexOf(color);
    return index >= 0 && index < (product?.images?.length || 0) ? index : -1;
  };

  const selectColorAndImage = (color, colors, setColor) => {
    const imageIndex = imageIndexForColor(colors, color);
    carouselSyncSource.current = imageIndex === pageCarousel.index ? null : 'color';
    setColor(color);
    if (imageIndex >= 0) pageCarousel.setIndex(imageIndex);
  };

  // Keep the ordered color list and ordered image list synchronized in both directions.
  useEffect(() => {
    if (!product?.images?.length) return;
    if (carouselSyncSource.current === 'color') {
      carouselSyncSource.current = null;
      return;
    }

    const colors = isMM
      ? selectionMode === 'enfant' ? (product.enfant_colors || product.colors || []) : (product.colors || [])
      : product.colors || [];
    const color = isMM
      ? selectionMode === 'enfant' ? enfantColor : adultColor
      : selectedColor;
    if (colors[pageCarousel.index] && colors[pageCarousel.index] !== color) {
      if (isMM) {
        if (selectionMode === 'enfant') setEnfantColor(colors[pageCarousel.index]);
        else setAdultColor(colors[pageCarousel.index]);
      } else {
        setSelectedColor(colors[pageCarousel.index]);
      }
    }
  }, [pageCarousel.index, product, isMM, selectionMode, adultColor, enfantColor, selectedColor]);

  useEffect(() => {
    if (!product?.images?.length) return;
    const colors = isMM
      ? selectionMode === 'enfant' ? (product.enfant_colors || product.colors || []) : (product.colors || [])
      : product.colors || [];
    const color = isMM
      ? selectionMode === 'enfant' ? enfantColor : adultColor
      : selectedColor;
    const imageIndex = imageIndexForColor(colors, color);
    if (imageIndex >= 0 && imageIndex !== pageCarousel.index) {
      carouselSyncSource.current = 'color';
      pageCarousel.setIndex(imageIndex);
    }
  }, [product, isMM, selectionMode, adultColor, enfantColor, selectedColor]);

  const renderPurchaseButton = () => {
    if (isMM) {
      const adultAvailable = adultSize && adultColor && (product.variants?.[`${adultSize}_${adultColor}`] || 0) > 0;
      const enfantAvailable = enfantSize && enfantColor && (product.variants?.[`${enfantSize}_${enfantColor}`] || 0) > 0;
      let disabled = false;
      let label = 'Acheter';
      if (selectionMode === 'adult') {
        disabled = !adultAvailable;
        label = 'Acheter l\'adulte';
      } else if (selectionMode === 'enfant') {
        disabled = !enfantAvailable;
        label = 'Acheter l\'enfant';
      } else {
        disabled = !adultAvailable && !enfantAvailable;
        label = 'Acheter les deux';
      }
      return (
        <button
          onClick={() => handleAddToCart(selectionMode === 'both' ? 'both' : selectionMode)}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-base md:text-lg shadow-lg hover:shadow-xl"
        >
          {label}
        </button>
      );
    }

    return (
      <button
        onClick={() => handleAddToCart('single')}
        disabled={currentVariantStock === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-base md:text-lg shadow-lg hover:shadow-xl"
      >
        {currentVariantStock === 0 ? 'Rupture de stock' : 'Acheter'}
      </button>
    );
  };


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

  // The lightbox track mounts after setIndex, so apply the selected slide once its DOM exists.
  useEffect(() => {
    if (!lightboxOpen || !product?.images?.length) return;
    const frame = requestAnimationFrame(() => {
      const track = lightboxCarousel.containerRef.current;
      if (!track) return;
      track.style.transition = 'none';
      track.style.transform = `translate3d(${-lightboxCarousel.index * 100}%, 0, 0)`;
    });
    return () => cancelAnimationFrame(frame);
  }, [lightboxOpen, product, lightboxCarousel.index]);

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
                         src={imgSrc(img, { width: 1200 })}
                         alt={`${product.name} - image ${idx + 1}`}
                         onClick={() => {
                           if (pageCarousel.swiped.current) { pageCarousel.swiped.current = false; return; }
                           openLightbox(idx);
                         }}
                         loading={idx === pageCarousel.index ? 'eager' : 'lazy'}
                         fetchPriority={idx === pageCarousel.index ? 'high' : 'low'}
                         sizes="(max-width: 767px) 100vw, 50vw"
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
                       src={imgSrc(img, { width: 180 })}
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
          <div className="mb-8 md:mb-10 pb-6 border-b border-purple-200">
            {isMM && product.enfant_price ? (
              <div className="flex items-end gap-6 mb-4">
                <div>
                  <span className="text-xs text-gray-500 font-medium uppercase">Adulte</span>
                  <div className="text-3xl md:text-4xl font-bold text-purple-600">TND {product.price.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium uppercase">Enfant</span>
                  <div className="text-3xl md:text-4xl font-bold text-pink-600">TND {product.enfant_price.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-purple-600">
                TND {product.price.toFixed(2)}
              </span>
            )}
            <span className={`inline-flex text-xs md:text-sm font-semibold ${product.stock > 0 ? 'text-green-600 bg-green-50 px-3 py-1 rounded-full' : 'text-red-600 bg-red-50 px-3 py-1 rounded-full'}`}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
            </span>
          </div>

          {isMM ? (
            <MatchyMatchyForm
              product={product}
              adultSize={adultSize} setAdultSize={setAdultSize}
              adultColor={adultColor} setAdultColor={setAdultColor}
              adultQty={adultQty} setAdultQty={setAdultQty}
              enfantSize={enfantSize} setEnfantSize={setEnfantSize}
              enfantColor={enfantColor} setEnfantColor={setEnfantColor}
              enfantQty={enfantQty} setEnfantQty={setEnfantQty}
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
            />
          ) : (
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
                <ColorSwatches
                  colors={product.colors}
                  value={selectedColor}
                  onChange={(color) => {
                    selectColorAndImage(color, product.colors, setSelectedColor);
                    setQuantity(1);
                  }}
                  getStock={(color) => selectedSize ? product.variants[`${selectedSize}_${color}`] || 0 : 0}
                  name="Couleur"
                />
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
          )}

          {/* Sticky CTA on mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-purple-200 md:static md:p-0 md:border-0 md:bg-transparent z-40 shadow-2xl md:shadow-none">
            {renderPurchaseButton()}
          </div>
        </div>
      </div>

      {/* Purchase CTA at the end of the product content */}
      <div className="mt-3 mb-8 md:hidden">
        {renderPurchaseButton()}
      </div>

      {/* Spacer so the page end isn't hidden behind the floating bar on mobile */}
      <div className="h-24 md:h-0" />

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
                     src={imgSrc(img, { width: 1600 })}
                     alt={`${product.name} - image ${idx + 1}`}
                     onClick={(e) => e.stopPropagation()}
                     loading={idx === lightboxCarousel.index ? 'eager' : 'lazy'}
                     fetchPriority={idx === lightboxCarousel.index ? 'high' : 'low'}
                     sizes="90vw"
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