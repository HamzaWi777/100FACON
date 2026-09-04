import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService, cartService } from '../services';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { governorates } from '../constants/governorates';
import { addToGuestCart, getOrCreateGuestSessionId } from '../utils/guestCart';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackPurchase } from '../utils/metaPixel';
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
  enfantSize, setEnfantSize,
  enfantColor, setEnfantColor,
  adultSelections, setAdultSelections,
  enfantSelections, setEnfantSelections,
  selectionMode, setSelectionMode,
  selectColorAndImage,
}) {
  const variants = product.variants || {};
  const updateSelection = (setter, index, field, value) => {
    setter((selections) => selections.map((selection, selectionIndex) => (
      selectionIndex === index ? { ...selection, [field]: value } : selection
    )));
  };
  const resizeSelections = (setter, selections, nextQuantity) => {
    const quantity = Math.max(1, Math.min(20, nextQuantity));
    const fallback = selections[0] || { size: '', color: '', voilee: false };
    setter(Array.from({ length: quantity }, (_, index) => selections[index] || { ...fallback }));
  };
  const hasEnoughStock = (selections) => {
    if (!selections.length || selections.some(({ size, color }) => !size || !color)) return false;
    const requested = selections.reduce((counts, { size, color, voilee }) => {
      let key;
      if (voilee && size.startsWith('adult_')) {
        key = `voilee_${size.replace('adult_', '')}_${color}`;
      } else {
        key = `${size}_${color}`;
      }
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    return Object.entries(requested).every(([key, count]) => (variants[key] || 0) >= count);
  };
  const colorDisplay = (color) => {
    const adultStock = Object.entries(variants).filter(([k]) => k.startsWith('adult_') && k.endsWith('_' + color)).reduce((s, [, v]) => s + v, 0);
    return `${color} ${adultStock === 0 ? '(Rupture)' : `(${adultStock} disponibles)`}`;
  };
  return (
    <div className="space-y-4 mb-5">
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
        {adultSelections.map((selection, index) => (
        <div key={`adult-${index}`} className="rounded-xl border border-purple-100 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">Adulte {index + 1}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {product.sizes.map(size => {
              const sizeStock = Object.entries(variants).reduce((sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0);
              const oos = sizeStock === 0;
              return (
                <button key={size} type="button" onClick={() => { updateSelection(setAdultSelections, index, 'size', size); if (index === 0) setAdultSize(size); }} disabled={oos} className={`rounded-lg border-2 px-4 py-2 font-medium transition ${selection.size === size ? 'border-purple-600 bg-purple-700 text-white' : oos ? 'border-gray-300 bg-gray-100 text-gray-400' : 'border-purple-200 text-gray-900 hover:border-purple-400'}`}>
                  {size.replace('adult_', '')}{oos && <span className="ml-1 text-xs">✕</span>}
                </button>
              );
            })}
          </div>
          <ColorSwatches
            colors={product.colors}
            value={selection.color}
            onChange={(color) => { updateSelection(setAdultSelections, index, 'color', color); selectColorAndImage(color, product.colors, setAdultColor); }}
            getStock={(color) => {
              if (!selection.size) return 0;
              if (selection.voilee && selection.size.startsWith('adult_')) {
                return variants[`voilee_${selection.size.replace('adult_', '')}_${color}`] || 0;
              }
              return variants[`${selection.size}_${color}`] || 0;
            }}
            name={`Couleur adulte ${index + 1}`}
          />
          {product.voilee && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Style</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSelection(setAdultSelections, index, 'voilee', false)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition ${
                    !selection.voilee
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  👩 Non voilée
                </button>
                <button
                  type="button"
                  onClick={() => updateSelection(setAdultSelections, index, 'voilee', true)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition ${
                    selection.voilee
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  🧕 Voilée
                </button>
              </div>
            </div>
          )}
        </div>
        ))}

        <div>
          <label className="block font-semibold mb-3 text-gray-900">Quantité adulte</label>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
            <button type="button" onClick={() => resizeSelections(setAdultSelections, adultSelections, adultSelections.length - 1)} className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600">−</button>
            <input
              type="number"
              value={adultSelections.length}
              onChange={(e) => resizeSelections(setAdultSelections, adultSelections, parseInt(e.target.value) || 1)}
              className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
              min="1"
              max={20}
            />
            <button type="button" disabled={adultSelections.length >= Object.entries(variants).filter(([key]) => key.startsWith('adult_')).reduce((sum, [, stock]) => sum + (parseInt(stock, 10) || 0), 0)} onClick={() => resizeSelections(setAdultSelections, adultSelections, adultSelections.length + 1)} className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600 disabled:cursor-not-allowed disabled:opacity-40">+</button>
          </div>
        </div>
      </>)
    }

      {/* ── Enfant ── */}
      {(selectionMode === 'enfant' || selectionMode === 'both') && (
      <>
        {enfantSelections.map((selection, index) => (
        <div key={`enfant-${index}`} className="rounded-xl border border-pink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">Enfant {index + 1}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(product.enfant_sizes || []).map(size => {
              const sizeStock = Object.entries(variants).reduce((sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0);
              const oos = sizeStock === 0;
              return (
                <button key={size} type="button" onClick={() => { updateSelection(setEnfantSelections, index, 'size', size); if (index === 0) setEnfantSize(size); }} disabled={oos} className={`rounded-lg border-2 px-4 py-2 font-medium transition ${selection.size === size ? 'border-pink-600 bg-pink-700 text-white' : oos ? 'border-gray-300 bg-gray-100 text-gray-400' : 'border-pink-200 text-gray-900 hover:border-pink-400'}`}>
                  {size.replace('enfant_', '')}{oos && <span className="ml-1 text-xs">✕</span>}
                </button>
              );
            })}
          </div>
          <ColorSwatches
            colors={product.enfant_colors || product.colors}
            value={selection.color}
            onChange={(color) => { updateSelection(setEnfantSelections, index, 'color', color); selectColorAndImage(color, product.enfant_colors || product.colors, setEnfantColor); }}
            getStock={(color) => selection.size ? variants[`${selection.size}_${color}`] || 0 : 0}
            name={`Couleur enfant ${index + 1}`}
          />
        </div>
        ))}

      <div>
          <label className="block font-semibold mb-3 text-gray-900">Quantité enfant</label>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <button type="button" onClick={() => resizeSelections(setEnfantSelections, enfantSelections, enfantSelections.length - 1)} className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600">−</button>
          <input
            type="number"
            value={enfantSelections.length}
            onChange={(e) => resizeSelections(setEnfantSelections, enfantSelections, parseInt(e.target.value) || 1)}
            className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
            min="1"
            max="20"
          />
          <button type="button" disabled={enfantSelections.length >= Object.entries(variants).filter(([key]) => key.startsWith('enfant_')).reduce((sum, [, stock]) => sum + (parseInt(stock, 10) || 0), 0)} onClick={() => resizeSelections(setEnfantSelections, enfantSelections, enfantSelections.length + 1)}
            className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
            >+</button>
          </div>
        </div>
      </>)
    }

      {/* Variant stock status */}
      <div className={`p-4 rounded-xl text-sm font-medium ${
        ((selectionMode === 'adult' && hasEnoughStock(adultSelections))
          || (selectionMode === 'enfant' && hasEnoughStock(enfantSelections))
          || (selectionMode === 'both' && hasEnoughStock(adultSelections) && hasEnoughStock(enfantSelections)))
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        {selectionMode === 'adult' && hasEnoughStock(adultSelections)
          ? `✓ ${adultSelections.length} article(s) adulte(s) sélectionné(s)`
          : selectionMode === 'enfant' && hasEnoughStock(enfantSelections)
            ? `✓ ${enfantSelections.length} article(s) enfant(s) sélectionné(s)`
            : selectionMode === 'both' && hasEnoughStock(adultSelections) && hasEnoughStock(enfantSelections)
              ? `✓ ${adultSelections.length + enfantSelections.length} article(s) sélectionné(s)`
              : '✕ Un article sélectionné est en rupture de stock ou incomplet'}
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectionRows, setSelectionRows] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbVisible, setLbVisible] = useState(false);
  const [adultSize, setAdultSize] = useState('');
  const [adultColor, setAdultColor] = useState('');
  const [adultSelections, setAdultSelections] = useState([{ size: '', color: '', voilee: false }]);
  const [enfantSize, setEnfantSize] = useState('');
  const [enfantColor, setEnfantColor] = useState('');
  const [enfantSelections, setEnfantSelections] = useState([{ size: '', color: '' }]);
  const [selectionMode, setSelectionMode] = useState('both');
  const [immediateOrderSubmitting, setImmediateOrderSubmitting] = useState(false);
  const [immediateOrderForm, setImmediateOrderForm] = useState({
    full_name: '', phone: '', shipping_address: '', wilaya: '',
  });
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
          setAdultSelections([{ size: data.sizes?.[0] || '', color: data.colors?.[0] || '', voilee: false }]);
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
          setEnfantSelections([{ size: data.enfant_sizes?.[0] || '', color: firstAvailEnfantColor || enfantColors[0] || '' }]);
       } else {
         const firstSize = data.sizes?.[0] || '';
         const firstColor = data.colors?.[0] || '';
         if (firstSize) setSelectedSize(firstSize);
         if (firstColor) setSelectedColor(firstColor);
         setSelectionRows([{ size: firstSize, color: firstColor }]);
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
        if (!hasEnoughStock(adultSelections)) {
          toast.error('Veuillez sélectionner une taille et couleur pour l\'adulte');
          return;
        }
        itemsToAdd.push(...adultSelections.map(({ size, color, voilee }) => {
          const actualSize = voilee && size.startsWith('adult_') ? `voilee_${size.replace('adult_', '')}` : size;
          const price = (voilee && product.voilee_price) ? product.voilee_price : product.price;
          return { size: actualSize, color, quantity: 1, label: 'adulte', voilee: voilee || false, price };
        }));
      }
      if (mode === 'enfant' || mode === 'both') {
        if (!hasEnoughStock(enfantSelections)) {
          toast.error('Veuillez sélectionner une taille et couleur pour l\'enfant');
          return;
        }
        itemsToAdd.push(...enfantSelections.map(({ size, color }) => ({ size, color, quantity: 1, label: 'enfant', voilee: false, price: product.enfant_price || product.price })));
      }
      if (itemsToAdd.length === 0) {
        toast.error('Veuillez sélectionner au moins une taille/couleur disponible');
        return;
      }
      try {
        const cartItems = itemsToAdd.map((item) => ({
          product_id: product.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          voilee: item.voilee || false,
        }));
        if (isAuthenticated) {
          await cartService.addItemsToCart(cartItems);
        } else {
          getOrCreateGuestSessionId();
          cartItems.forEach((item) => addToGuestCart(product, item.quantity, item.size, item.color, item.price, item.voilee));
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
    if (selectionRows.length === 0 || selectionRows.some(row => !row.size || !row.color)) {
      toast.error('Please select a size and color for each item');
      return;
    }
    if (selectionRows.some(row => !(product.variants?.[`${row.size}_${row.color}`] > 0))) {
      toast.error('One of the selected size and color combinations is out of stock');
      return;
    }
    try {
      const cartItems = selectionRows.map((row) => ({
        product_id: product.id,
        quantity: 1,
        size: row.size,
        color: row.color,
      }));
      if (isAuthenticated) {
        await cartService.addItemsToCart(cartItems);
      } else {
        getOrCreateGuestSessionId();
        cartItems.forEach((item) => addToGuestCart(product, 1, item.size, item.color));
      }
      trackAddToCart({ id: product.id, name: product.name, price: product.price, quantity: selectionRows.length });
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
  const hasEnoughStock = (selections) => {
    if (!selections.length || selections.some(({ size, color }) => !size || !color)) return false;
    const requested = selections.reduce((counts, { size, color }) => {
      const key = `${size}_${color}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
    return Object.entries(requested).every(([key, count]) => (product?.variants?.[key] || 0) >= count);
  };

  const allSelectionsValid = hasEnoughStock(selectionRows);
  const activeMatchySelectionsValid = selectionMode === 'adult'
    ? hasEnoughStock(adultSelections)
    : selectionMode === 'enfant'
      ? hasEnoughStock(enfantSelections)
      : hasEnoughStock(adultSelections) && hasEnoughStock(enfantSelections);

  const updateSelectionRow = (rowIndex, field, value) => {
    setSelectionRows((rows) => rows.map((row, index) => (
      index === rowIndex ? { ...row, [field]: value } : row
    )));
    if (rowIndex === 0) {
      if (field === 'size') setSelectedSize(value);
      if (field === 'color') setSelectedColor(value);
    }
  };

  const setSelectionQuantity = (nextQuantity) => {
    const normalizedQuantity = Math.max(1, Math.min(20, product?.stock || 1, nextQuantity));
    setQuantity(normalizedQuantity);
    setSelectionRows((rows) => {
      const fallback = rows[0] || { size: selectedSize, color: selectedColor };
      return Array.from({ length: normalizedQuantity }, (_, index) => rows[index] || { ...fallback });
    });
  };

  useEffect(() => {
    if (!user) return;
    setImmediateOrderForm((current) => ({
      ...current,
      full_name: user.full_name || current.full_name,
      phone: user.phone || current.phone,
      shipping_address: user.address || current.shipping_address,
      wilaya: user.wilaya || current.wilaya,
    }));
  }, [user]);

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

  // Keep color → image synchronized (selecting a color changes the image).
  useEffect(() => {
    if (!product?.images?.length) return;
    const colors = isMM
      ? selectionMode === 'enfant' ? (product.enfant_colors || product.colors || []) : (product.colors || [])
      : product.colors || [];
    const color = isMM
      ? selectionMode === 'enfant' ? enfantColor : adultColor
      : selectedColor;
    const imageIndex = imageIndexForColor(colors, color);
    if (imageIndex >= 0) {
      carouselSyncSource.current = 'color';
      pageCarousel.setIndex(imageIndex);
    }
  }, [product, isMM, selectionMode, adultColor, enfantColor, selectedColor]);

  const renderPurchaseButton = () => {
    if (isMM) {
      let disabled = false;
      let label = 'Ajouter au panier';
      if (selectionMode === 'adult') {
        disabled = !activeMatchySelectionsValid;
      } else if (selectionMode === 'enfant') {
        disabled = !activeMatchySelectionsValid;
      } else {
        disabled = !activeMatchySelectionsValid;
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
        disabled={!allSelectionsValid}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 font-bold text-base md:text-lg shadow-lg hover:shadow-xl"
      >
        {!allSelectionsValid ? 'Sélection incomplète' : 'Ajouter au panier'}
      </button>
    );
  };

  const getImmediateOrderItems = () => {
    if (isMM) {
      const selections = [];
      if (selectionMode === 'adult' || selectionMode === 'both') {
        if (!hasEnoughStock(adultSelections)) return null;
        selections.push(...adultSelections.map(({ size, color, voilee }) => {
          const actualSize = voilee && size.startsWith('adult_') ? `voilee_${size.replace('adult_', '')}` : size;
          const price = (voilee && product.voilee_price) ? product.voilee_price : product.price;
          return { product_id: product.id, quantity: 1, size: actualSize, color, price, voilee: voilee || false };
        }));
      }
      if (selectionMode === 'enfant' || selectionMode === 'both') {
        if (!hasEnoughStock(enfantSelections)) return null;
        selections.push(...enfantSelections.map(({ size, color }) => ({ product_id: product.id, quantity: 1, size, color, price: product.enfant_price || product.price, voilee: false })));
      }
      return selections.length ? selections : null;
    }
    if (selectionRows.length === 0 || selectionRows.some(row => !row.size || !row.color)) return null;
    if (!hasEnoughStock(selectionRows)) return null;
    return selectionRows.map((row) => ({
      product_id: product.id,
      quantity: 1,
      size: row.size,
      color: row.color,
      price: product.price,
    }));
  };

  const immediateOrderItems = getImmediateOrderItems();
  const immediateSubtotal = immediateOrderItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const handleImmediateOrderChange = (event) => {
    setImmediateOrderForm({ ...immediateOrderForm, [event.target.name]: event.target.value });
  };

  const handleImmediateOrderSubmit = async (event) => {
    event.preventDefault();
    if (!immediateOrderItems) {
      toast.error('Veuillez sélectionner une combinaison disponible');
      return;
    }
    setImmediateOrderSubmitting(true);
    try {
      trackInitiateCheckout({
        value: immediateSubtotal + 8,
        currency: 'TND',
        contentIds: [product.id],
        numItems: immediateOrderItems.reduce((sum, item) => sum + item.quantity, 0),
      });
      const response = await orderService.createOrder({
        ...immediateOrderForm,
        guest_name: isAuthenticated ? undefined : immediateOrderForm.full_name,
        directItems: immediateOrderItems,
      });
      trackPurchase({
        orderId: response.data.orderId,
        value: response.data.totalPrice + 8,
        currency: 'TND',
        contentIds: [product.id],
        numItems: immediateOrderItems.reduce((sum, item) => sum + item.quantity, 0),
      });
      toast.success('Commande confirmée avec succès');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible de confirmer la commande');
    } finally {
      setImmediateOrderSubmitting(false);
    }
  };

  const renderImmediateOrderForm = () => (
    <div className="mt-6 border-t border-purple-200 pt-5">
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-gray-900">Commander maintenant</h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">Livraison à domicile</span>
        </div>
        <form onSubmit={handleImmediateOrderSubmit} className="space-y-3">
          {!isAuthenticated && (
            <div>
              <label htmlFor="immediate-full-name" className="mb-1 block text-xs font-semibold text-gray-700">Nom complet *</label>
              <input id="immediate-full-name" type="text" name="full_name" value={immediateOrderForm.full_name} onChange={handleImmediateOrderChange} placeholder="Votre nom" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200" />
            </div>
          )}
          {isAuthenticated && <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700">{user?.full_name}</div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="immediate-phone" className="mb-1 block text-xs font-semibold text-gray-700">Téléphone *</label>
              <input id="immediate-phone" type="tel" name="phone" value={immediateOrderForm.phone} onChange={handleImmediateOrderChange} placeholder="Votre numéro" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200" />
            </div>
            <div>
              <label htmlFor="immediate-wilaya" className="mb-1 block text-xs font-semibold text-gray-700">Gouvernorat *</label>
              <select id="immediate-wilaya" name="wilaya" value={immediateOrderForm.wilaya} onChange={handleImmediateOrderChange} required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                <option value="">Choisir une ville</option>
                {governorates.map((governorate) => <option key={governorate} value={governorate}>{governorate}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="immediate-address" className="mb-1 block text-xs font-semibold text-gray-700">Adresse *</label>
            <textarea id="immediate-address" name="shipping_address" value={immediateOrderForm.shipping_address} onChange={handleImmediateOrderChange} placeholder="Votre adresse de livraison" rows="2" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200" />
          </div>
          <div className="space-y-2 border-t border-purple-200 pt-3 text-sm text-gray-700">
            <div className="flex justify-between"><span>Sous-total:</span><span className="font-semibold">TND {immediateSubtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Livraison:</span><span className="font-semibold text-green-600">TND 8.00</span></div>
            <div className="flex justify-between border-t border-purple-100 pt-2 text-lg font-bold text-purple-600"><span>Total:</span><span>TND {(immediateSubtotal + 8).toFixed(2)}</span></div>
          </div>
          <button type="submit" disabled={immediateOrderSubmitting || !immediateOrderItems} className="w-full rounded-lg bg-purple-700 py-3 font-bold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50">
            {immediateOrderSubmitting ? 'Traitement en cours...' : 'Commander maintenant'}
          </button>
        </form>
      </div>
    </div>
  );


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
    <div className="container mx-auto px-4 py-4 md:py-6">
      <button
        onClick={() => navigate('/products')}
        className="text-purple-600 hover:text-purple-700 mb-4 md:mb-6 flex items-center gap-1 text-sm md:text-base font-medium transition"
      >
        ← Retour à la collection
      </button>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">

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
          <div className="mt-5 border-t border-purple-200 pt-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 md:text-base">
              {product.description}
            </p>
          </div>
        </div>

        {/* ── Product Info ── */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900">
            {product.name}
          </h1>

          {/* Price + stock */}
          <div className="mb-5 md:mb-6 pb-4 border-b border-purple-200">
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
              {product.stock > 0 ? `en stock` : 'Rupture de stock'}
            </span>
          </div>

          {isMM ? (
            <MatchyMatchyForm
              product={product}
              adultSize={adultSize} setAdultSize={setAdultSize}
              adultColor={adultColor} setAdultColor={setAdultColor}
              enfantSize={enfantSize} setEnfantSize={setEnfantSize}
              enfantColor={enfantColor} setEnfantColor={setEnfantColor}
              adultSelections={adultSelections} setAdultSelections={setAdultSelections}
              enfantSelections={enfantSelections} setEnfantSelections={setEnfantSelections}
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
              selectColorAndImage={selectColorAndImage}
            />
          ) : (
          <div className="space-y-4 mb-5">

            {selectionRows.map((row, rowIndex) => (
              <div key={rowIndex} className="rounded-xl border border-purple-100 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">Article {rowIndex + 1}</p>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Taille</label>
                <div className="mb-4 flex flex-wrap gap-2">
                  {product.sizes?.map(size => {
                    const sizeStock = Object.entries(product.variants || {}).reduce(
                      (sum, [key, stock]) => key.startsWith(size + '_') ? sum + stock : sum, 0
                    );
                    const oos = sizeStock === 0;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSelectionRow(rowIndex, 'size', size)}
                        disabled={oos}
                        className={`rounded-lg border-2 px-4 py-2 font-medium transition ${
                          row.size === size ? 'border-purple-600 bg-purple-700 text-white' : oos ? 'border-gray-300 bg-gray-100 text-gray-400' : 'border-purple-200 text-gray-900 hover:border-purple-400'
                        }`}
                      >
                        {size}{oos && <span className="ml-1 text-xs">✕</span>}
                      </button>
                    );
                  })}
                </div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Couleur</label>
                <ColorSwatches
                  colors={product.colors || []}
                  value={row.color}
                  onChange={(color) => {
                    updateSelectionRow(rowIndex, 'color', color);
                    selectColorAndImage(color, product.colors, setSelectedColor);
                  }}
                  getStock={(color) => row.size ? product.variants?.[`${row.size}_${color}`] || 0 : 0}
                  name={`Couleur article ${rowIndex + 1}`}
                />
              </div>
            ))}

            {/* Variant stock status */}
            <div className={`p-4 rounded-xl text-sm font-medium ${
              allSelectionsValid
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
                {allSelectionsValid
                  ? `✓ ${selectionRows.length} article(s) sélectionné(s)`
                  : '✕ Un article sélectionné est en rupture de stock ou incomplet'}
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold mb-3 text-gray-900">Quantité</label>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setSelectionQuantity(selectionRows.length - 1)}
                  className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={selectionRows.length}
                  onChange={(e) => setSelectionQuantity(parseInt(e.target.value) || 1)}
                  className="w-12 text-center px-2 py-2 bg-gray-100 border-0 font-bold"
                  min="1"
                  max={Math.min(20, product.stock || 1)}
                />
                <button
                  onClick={() => setSelectionQuantity(selectionRows.length + 1)}
                  disabled={selectionRows.length >= Math.min(20, product.stock || 1)}
                  className="w-10 h-10 hover:bg-purple-200 rounded-lg transition font-bold text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          )}

          {renderImmediateOrderForm()}

          {/* Sticky CTA on mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-purple-200 md:static md:p-0 md:border-0 md:bg-transparent z-40 shadow-2xl md:shadow-none">
            {renderPurchaseButton()}
          </div>
        </div>
      </div>

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