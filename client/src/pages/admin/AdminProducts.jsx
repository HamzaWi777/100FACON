import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productService } from '../../services';
import { ColorPalette } from '../../components/ColorSwatches';

const DEFAULT_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50', '52'];
const ENFANTS_SIZES = ['6', '8', '10', '12', '14'];
const ADULT_SIZE_PREFIX = 'adult_';
const ENFANT_SIZE_PREFIX = 'enfant_';

const sizesForCategory = (category) =>
  category === 'enfants' ? ENFANTS_SIZES : DEFAULT_SIZES;

const prefixedSizes = (prefix, sizes) => sizes.map(s => `${prefix}${s}`);

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', enfantPrice: '', category: 'men', colors: [], enfantColors: [], isMatchyMatchy: false });
  const [variantStock, setVariantStock] = useState({});
  const [images, setImages] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll({ limit: 100 });
      setProducts(response.data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVariantStockChange = (size, color, value) => {
    setVariantStock({ ...variantStock, [`${size}_${color}`]: parseInt(value) || 0 });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...selectedFiles]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(variantStock).length === 0) {
      toast.error('Please set stock for at least one size/color combination');
      return;
    }
    const colors = formData.colors;
    const enfantColors = formData.enfantColors;
    const isMatchy = formData.category === 'matchy_matchy' || formData.isMatchyMatchy;
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('description', formData.description);
    fd.append('price', formData.price);
    fd.append('enfantPrice', isMatchy ? formData.enfantPrice : '');
    fd.append('category', formData.category);
    fd.append('colors', JSON.stringify(colors));
    const adultSizes = prefixedSizes(ADULT_SIZE_PREFIX, DEFAULT_SIZES);
    const enfantSizes = prefixedSizes(ENFANT_SIZE_PREFIX, ENFANTS_SIZES);
    fd.append('isMatchyMatchy', isMatchy);
    fd.append('sizes', JSON.stringify(isMatchy ? adultSizes : sizesForCategory(formData.category)));
    fd.append('enfantSizes', JSON.stringify(isMatchy ? enfantSizes : []));
    fd.append('enfantColors', JSON.stringify(isMatchy ? enfantColors : []));
    fd.append('variantStock', JSON.stringify(variantStock));
    images.forEach((image) => fd.append('images', image.file));
    try {
      if (editingId) {
        await productService.update(editingId, fd);
        toast.success('Product updated');
      } else {
        await productService.create(fd);
        toast.success('Product created');
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    const isMatchy = product.is_matchy_matchy || product.category === 'matchy_matchy';
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      enfantPrice: product.enfant_price || '',
      category: product.category,
      colors: product.colors || [],
      enfantColors: product.enfant_colors || [],
      isMatchyMatchy: isMatchy,
    });
    setVariantStock(product.variants || {});
    setImages([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await productService.delete(id);
        toast.success('Product deleted');
        fetchProducts();
      } catch {
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', enfantPrice: '', category: 'men', colors: [], enfantColors: [], isMatchyMatchy: false });
    setVariantStock({});
    setImages([]);
    setEditingId(null);
    setShowForm(false);
  };

  const colors = formData.colors;
  const displayColors = colors.length > 0 ? colors : ['No Color'];
  const enfantColorsArr = formData.enfantColors;
  const displayEnfantColors = enfantColorsArr.length > 0 ? enfantColorsArr : ['No Color'];
  const isMM = formData.category === 'matchy_matchy';
  const adultActiveSizes = prefixedSizes(ADULT_SIZE_PREFIX, DEFAULT_SIZES);
  const enfantActiveSizes = prefixedSizes(ENFANT_SIZE_PREFIX, ENFANTS_SIZES);
  const activeSizes = isMM ? adultActiveSizes : sizesForCategory(formData.category);

  const toggleColor = (field, color) => {
    setFormData((current) => ({
      ...current,
      [field]: current[field].includes(color)
        ? current[field].filter((selectedColor) => selectedColor !== color)
        : [...current[field], color],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">Produits</h1>
        <button
          onClick={() => !showForm ? setShowForm(true) : resetForm()}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 md:px-8 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition text-sm md:text-base font-semibold"
        >
          {showForm ? 'Annuler' : '+ Ajouter un produit'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-purple-100 mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-gray-900">
            {editingId ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nom du produit</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Catégorie</label>
                <select name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                   {['men', 'women', 'accessories', 'shoes', 'enfants', 'matchy_matchy'].map(c => (
                     <option key={c} value={c}>{c === 'men' ? 'Hommes' : c === 'women' ? 'Femmes' : c === 'accessories' ? 'Accessoires' : c === 'shoes' ? 'Chaussures' : c === 'enfants' ? 'Enfants' : c === 'matchy_matchy' ? 'Matchy Matchy' : 'Enfants'}</option>
                   ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>

            {/* Price + Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{isMM ? 'Prix adulte (TND)' : 'Prix (TND)'}</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{isMM ? 'Couleurs adulte' : 'Couleurs'}</label>
                <ColorPalette selectedColors={formData.colors} onToggle={(color) => toggleColor('colors', color)} name="Couleurs adulte" />
              </div>
            </div>

            {/* Matchy Matchy: Enfant Price + Colors */}
            {isMM && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Prix enfant (TND)</label>
                  <input type="number" name="enfantPrice" value={formData.enfantPrice} onChange={handleInputChange} step="0.01" required
                    className="w-full px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Couleurs enfant</label>
                  <ColorPalette selectedColors={formData.enfantColors} onToggle={(color) => toggleColor('enfantColors', color)} name="Couleurs enfant" />
                </div>
              </div>
            )}

            {/* Variant stock — horizontal scroll on mobile */}
            <div>
              {isMM ? (
                <>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-900 mb-3">Stock adulte par taille et couleur</label>
                    <div className="overflow-x-auto border-2 border-purple-200 rounded-lg mb-4">
                      <table className="w-full min-w-max">
                        <thead>
                          <tr className="bg-purple-100 border-b-2 border-purple-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900 sticky left-0 bg-purple-100">Taille (Adulte)</th>
                            {displayColors.map(color => (
                              <th key={color} className="px-4 py-3 text-left text-sm font-semibold text-purple-900 whitespace-nowrap">{color}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adultActiveSizes.map(size => (
                            <tr key={size} className="border-b border-purple-100 hover:bg-purple-50">
                              <td className="px-4 py-2 font-medium text-sm bg-purple-50 sticky left-0">{size.replace(ADULT_SIZE_PREFIX, '')}</td>
                              {displayColors.map(color => (
                                <td key={`${size}-${color}`} className="px-4 py-2">
                                  <input type="number" min="0"
                                    value={variantStock[`${size}_${color}`] || ''}
                                    onChange={(e) => handleVariantStockChange(size, color, e.target.value)}
                                    placeholder="0"
                                    className="w-16 px-2 py-1 border border-purple-300 rounded text-center text-sm focus:ring-2 focus:ring-purple-500" />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Stock enfant par taille et couleur</label>
                    <div className="overflow-x-auto border-2 border-purple-200 rounded-lg">
                      <table className="w-full min-w-max">
                        <thead>
                          <tr className="bg-pink-100 border-b-2 border-purple-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900 sticky left-0 bg-pink-100">Taille (Enfant)</th>
                             {displayEnfantColors.map(color => (
                               <th key={color} className="px-4 py-3 text-left text-sm font-semibold text-purple-900 whitespace-nowrap">{color}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {enfantActiveSizes.map(size => (
                            <tr key={size} className="border-b border-purple-100 hover:bg-purple-50">
                               <td className="px-4 py-2 font-medium text-sm bg-pink-50 sticky left-0">{size.replace(ENFANT_SIZE_PREFIX, '')}</td>
                               {displayEnfantColors.map(color => (
                                 <td key={`${size}-${color}`} className="px-4 py-2">
                                  <input type="number" min="0"
                                    value={variantStock[`${size}_${color}`] || ''}
                                    onChange={(e) => handleVariantStockChange(size, color, e.target.value)}
                                    placeholder="0"
                                    className="w-16 px-2 py-1 border border-purple-300 rounded text-center text-sm focus:ring-2 focus:ring-purple-500" />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Stock par taille et couleur</label>
                  <div className="overflow-x-auto border-2 border-purple-200 rounded-lg">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="bg-purple-100 border-b-2 border-purple-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900 sticky left-0 bg-purple-100">Taille</th>
                          {displayColors.map(color => (
                            <th key={color} className="px-4 py-3 text-left text-sm font-semibold text-purple-900 whitespace-nowrap">{color}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeSizes.map(size => (
                          <tr key={size} className="border-b border-purple-100 hover:bg-purple-50">
                            <td className="px-4 py-2 font-medium text-sm bg-purple-50 sticky left-0">{size}</td>
                            {displayColors.map(color => (
                              <td key={`${size}-${color}`} className="px-4 py-2">
                                <input type="number" min="0"
                                  value={variantStock[`${size}_${color}`] || ''}
                                  onChange={(e) => handleVariantStockChange(size, color, e.target.value)}
                                  placeholder="0"
                                  className="w-16 px-2 py-1 border border-purple-300 rounded text-center text-sm focus:ring-2 focus:ring-purple-500" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Images (max 15)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={images.length >= 15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              {images.length > 0 && (
                <>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((image, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border-2 border-purple-200">
                        <img src={image.preview} alt={`preview-${idx}`} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1">
                    {images.map((image, idx) => (
                      <div key={`name-${idx}`} className="flex items-center justify-between text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                        <span className="truncate mr-2">{idx + 1}. {image.file.name}</span>
                        <button type="button" onClick={() => removeImage(idx)} className="text-red-500 hover:text-red-700 flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-bold">
              {editingId ? 'Mettre à jour le produit' : 'Créer le produit'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-purple-100 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200 bg-purple-50">
                  <th className="text-left py-4 px-4 text-purple-900 font-semibold">Nom</th>
                  <th className="text-left py-4 px-4 text-purple-900 font-semibold">Catégorie</th>
                  <th className="text-left py-4 px-4 text-purple-900 font-semibold">Prix</th>
                  <th className="text-left py-4 px-4 text-purple-900 font-semibold">Stock</th>
                  <th className="text-left py-4 px-4 text-purple-900 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-purple-100 hover:bg-purple-50 transition">
                    <td className="py-4 px-4 font-semibold text-gray-900">{product.name}</td>
                    <td className="py-4 px-4 capitalize text-gray-600">{product.category}</td>
                    <td className="py-4 px-4 font-semibold text-purple-600">TND {product.price.toFixed(2)}</td>
                    <td className="py-4 px-4"><span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{product.stock}</span></td>
                    <td className="py-4 px-4">
                      <button onClick={() => handleEdit(product)} className="text-purple-600 hover:text-purple-800 font-medium mr-4 text-sm">Modifier</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow border border-purple-100 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{product.category}</p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 px-2 py-1 rounded-lg ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stock > 0 ? `${product.stock}` : 'Rupture'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-purple-600 text-sm">TND {product.price.toFixed(2)}</span>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(product)} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Modifier</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}