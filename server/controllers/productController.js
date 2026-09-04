import pool from '../config/database.js';
import cloudinary from '../config/cloudinary.js';

function parseVariantKey(key) {
  const parts = key.split('_');
  if (parts[0] === 'adult' || parts[0] === 'enfant') {
    return { variantType: parts[0], size: `${parts[0]}_${parts[1]}`, color: parts.slice(2).join('_') };
  }
  return { variantType: 'adult', size: parts[0], color: parts.slice(1).join('_') };
}

function safeParseJSON(value, fallback) {
  if (!value) return fallback;
  try { return typeof value === 'string' ? JSON.parse(value) : value; }
  catch { return fallback; }
}

function filterVariantStock(variantStock, sizes, colors, enfantSizes, enfantColors, isMatchyProduct) {
  const validKeys = new Set([
    ...(isMatchyProduct ? enfantSizes : []).flatMap(size => enfantColors.map(color => `${size}_${color}`)),
    ...sizes.flatMap(size => colors.map(color => `${size}_${color}`)),
  ]);
  return Object.fromEntries(Object.entries(variantStock).filter(([key]) => validKeys.has(key)));
}

function isValidVariant(variant, sizes, colors, enfantSizes, enfantColors, isMatchyProduct) {
  const isEnfantVariant = isMatchyProduct && variant.size?.startsWith('enfant_');
  const validSizes = isEnfantVariant ? enfantSizes : sizes;
  const validColors = isEnfantVariant ? enfantColors : colors;
  return validSizes.includes(variant.size) && validColors.includes(variant.color);
}

export async function getAllProducts(req, res) {
  try {
    console.log('📥 Received query params:', req.query); // ADD THIS

    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add sorting
    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    console.log('🔍 Final SQL query:', query); // ADD THIS
    console.log('📊 Query params:', params); // ADD THIS

    const [products] = await pool.query(query, params);

    console.log('✅ Products fetched:', products.length); // ADD THIS

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams = [];

    if (category && category !== 'all') {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (minPrice) {
      countQuery += ' AND price >= ?';
      countParams.push(minPrice);
    }
    if (maxPrice) {
      countQuery += ' AND price <= ?';
      countParams.push(maxPrice);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

  // Parse JSON fields with error handling for matchy_matchy + enfant_sizes
  const parsedProducts = await Promise.all(products.map(async (p) => {
    let images = [];
    let sizes = [];
    let colors = [];
    let enfantSizes = [];
    let enfantColors = [];

    try {
      if (p.images) {
        if (typeof p.images === 'string') {
          try {
            images = JSON.parse(p.images);
          } catch (parseError) {
            images = p.images.startsWith('/') || p.images.startsWith('http') ? [p.images] : [];
          }
        } else {
          images = p.images;
        }
      }
    } catch (e) {
      console.warn(`Invalid JSON in images for product ${p.id}:`, p.images);
      images = [];
    }

    try {
      if (p.sizes) {
        if (typeof p.sizes === 'string') {
          sizes = JSON.parse(p.sizes);
        } else {
          sizes = p.sizes;
        }
      }
    } catch (e) {
      console.warn(`Invalid JSON in sizes for product ${p.id}:`, p.sizes);
      sizes = [];
    }

    try {
      if (p.colors) {
        if (typeof p.colors === 'string') {
          colors = JSON.parse(p.colors);
        } else {
          colors = p.colors;
        }
      }
    } catch (e) {
      console.warn(`Invalid JSON in colors for product ${p.id}:`, p.colors);
      colors = [];
    }

    try {
      if (p.enfant_sizes) {
        if (typeof p.enfant_sizes === 'string') {
          enfantSizes = JSON.parse(p.enfant_sizes);
        } else {
          enfantSizes = p.enfant_sizes;
        }
      }
    } catch (e) {
      console.warn(`Invalid JSON in enfant_sizes for product ${p.id}:`, p.enfant_sizes);
      enfantSizes = [];
    }

    try {
      enfantColors = safeParseJSON(p.enfant_colors, []);
    } catch (e) {
      enfantColors = [];
    }

    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [p.id]);
    const validVariants = variants.filter(v => isValidVariant(v, sizes, colors, enfantSizes, enfantColors, p.is_matchy_matchy === 1));
    const variantStock = {};
    validVariants.forEach(v => {
      const key = `${v.size || 'none'}_${v.color || 'none'}`;
      variantStock[key] = v.stock;
    });

    return {
      ...p,
      stock: Object.values(variantStock).reduce((sum, stock) => sum + (parseInt(stock, 10) || 0), 0),
      price: parseFloat(p.price),
      enfant_price: p.enfant_price ? parseFloat(p.enfant_price) : null,
      is_matchy_matchy: p.is_matchy_matchy ? p.is_matchy_matchy === 1 : false,
      voilee: p.voilee ? p.voilee === 1 : false,
      enfant_sizes: enfantSizes,
      enfant_colors: enfantColors,
      images,
      sizes,
      colors,
      variants: variantStock,
    };
  }));

    res.json({
      products: parsedProducts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllProducts:', error); // ADD THIS
    res.status(500).json({ error: error.message });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    
    // Safe JSON parsing
    let images = [];
    let sizes = [];
    let colors = [];
    let enfantSizes = [];
    let enfantColors = []

    try {
      if (product.images) {
        if (typeof product.images === 'string') {
          try {
            images = JSON.parse(product.images);
          } catch (parseError) {
            images = product.images.startsWith('/') || product.images.startsWith('http') ? [product.images] : [];
          }
        } else {
          images = product.images;
        }
      }
    } catch (e) {
      console.warn(`Invalid JSON in images for product ${id}`);
    }

    try {
      sizes = product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [];
    } catch (e) {
      console.warn(`Invalid JSON in sizes for product ${id}`);
    }

    try {
      colors = product.colors ? (typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors) : [];
    } catch (e) {
      console.warn(`Invalid JSON in colors for product ${id}`);
    }

    try {
      enfantSizes = product.enfant_sizes ? (typeof product.enfant_sizes === 'string' ? JSON.parse(product.enfant_sizes) : product.enfant_sizes) : [];
    } catch (e) {
      console.warn(`Invalid JSON in enfant_sizes for product ${id}`);
    }

    enfantColors = safeParseJSON(product.enfant_colors, []);

    // Fetch variants for this product
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [id]);
    const validVariants = variants.filter(v => isValidVariant( v, sizes, colors, enfantSizes, enfantColors, product.is_matchy_matchy === 1));
    const variantStock = {};
    validVariants.forEach(v => {
      const key = `${v.size || 'none'}_${v.color || 'none'}`;
      variantStock[key] = v.stock;
    });

    res.json({
      ...product,
      stock: Object.values(variantStock).reduce((sum, stock) => sum + (parseInt(stock, 10) || 0), 0),
      price: parseFloat(product.price),
      enfant_price: product.enfant_price ? parseFloat(product.enfant_price) : null,
      is_matchy_matchy: product.is_matchy_matchy ? product.is_matchy_matchy === 1 : false,
      voilee: product.voilee ? product.voilee === 1 : false,
      enfant_sizes: enfantSizes,
      enfant_colors: enfantColors,
      images,
      sizes,
      colors,
      variants: variantStock,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, description, price, enfantPrice, category, sizes, colors, enfantColors, variantStock, enfantSizes, voilee } = req.body;
    const isMatchyProduct = category === 'matchy_matchy';

    let parsedVariantStock = {};
    if (variantStock) {
      try {
        parsedVariantStock = typeof variantStock === 'string' ? JSON.parse(variantStock) : variantStock;
      } catch (e) {
        console.error('Error parsing variantStock:', e);
        parsedVariantStock = {};
      }
    }

    let parsedEnfantSizes = [];
    if (enfantSizes) {
      try {
        parsedEnfantSizes = typeof enfantSizes === 'string' ? JSON.parse(enfantSizes) : enfantSizes;
      } catch (e) {
        parsedEnfantSizes = [];
      }
    }

    let parsedEnfantColors = [];
    if (enfantColors) {
      try {
        parsedEnfantColors = typeof enfantColors === 'string' ? JSON.parse(enfantColors) : enfantColors;
      } catch (e) {
        parsedEnfantColors = [];
      }
    }

    // Upload images to Cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadToCloudinary = (fileBuffer) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'ecommerce-products',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            uploadStream.end(fileBuffer);
          });
        };
        const imageUrl = await uploadToCloudinary(file.buffer);
        images.push(imageUrl);
      }
    }

    let parsedColors = [];
    if (colors) {
      try {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch (e) {
        parsedColors = [];
      }
    }

    let parsedSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
    if (sizes) {
      try {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      } catch (e) {
        parsedSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
      }
    }

    parsedVariantStock = filterVariantStock(
      parsedVariantStock,
      parsedSizes,
      safeParseJSON(colors, []),
      parsedEnfantSizes,
      parsedEnfantColors,
      isMatchyProduct
    );

    let totalStock = 0;
    if (parsedVariantStock && typeof parsedVariantStock === 'object') {
      totalStock = Object.values(parsedVariantStock).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, enfant_price, category, stock, images, sizes, colors, enfant_colors, is_matchy_matchy, enfant_sizes, voilee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description,
        price,
        isMatchyProduct ? (enfantPrice || null) : null,
        category,
        totalStock,
        JSON.stringify(images),
        JSON.stringify(parsedSizes),
        JSON.stringify(parsedColors),
        JSON.stringify(isMatchyProduct ? parsedEnfantColors : []),
        isMatchyProduct ? 1 : 0,
        JSON.stringify(isMatchyProduct ? parsedEnfantSizes : []),
        isMatchyProduct ? (voilee ? 1 : 0) : 0,
      ]
    );

    const productId = result.insertId;

    if (parsedVariantStock && typeof parsedVariantStock === 'object') {
      for (const [key, stock] of Object.entries(parsedVariantStock)) {
        const { size, color } = parseVariantKey(key);
        await pool.query(
          'INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)',
          [productId, size || null, color || null, parseInt(stock) || 0]
        );
      }
    }

    res.status(201).json({
      message: 'Product created successfully',
      id: productId,
    });
    } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, enfantPrice, category, sizes, colors, enfantColors, variantStock, enfantSizes, voilee } = req.body;
    const isMatchyProduct = category === 'matchy_matchy';

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let parsedVariantStock = {};
    if (variantStock) {
      try {
        parsedVariantStock = typeof variantStock === 'string' ? JSON.parse(variantStock) : variantStock;
      } catch (e) {
        console.error('Error parsing variantStock:', e);
        parsedVariantStock = {};
      }
    }

    let parsedEnfantSizes = [];
    if (enfantSizes) {
      try {
        parsedEnfantSizes = typeof enfantSizes === 'string' ? JSON.parse(enfantSizes) : enfantSizes;
      } catch (e) {
        parsedEnfantSizes = [];
      }
    }

    // If the product is not matchy matchy, parse enfant_sizes from the DB for backward compat
    if (!enfantSizes && products[0].enfant_sizes) {
      try {
        parsedEnfantSizes = typeof products[0].enfant_sizes === 'string' ? JSON.parse(products[0].enfant_sizes) : products[0].enfant_sizes;
      } catch (e) {
        parsedEnfantSizes = [];
      }
    }

    let parsedEnfantColors = [];
    if (enfantColors) {
      try {
        parsedEnfantColors = typeof enfantColors === 'string' ? JSON.parse(enfantColors) : enfantColors;
      } catch (e) {
        parsedEnfantColors = [];
      }
    }

    // Backward compat: parse enfant_colors from DB
    if (!enfantColors && products[0].enfant_colors) {
      try {
        parsedEnfantColors = typeof products[0].enfant_colors === 'string' ? JSON.parse(products[0].enfant_colors) : products[0].enfant_colors;
      } catch (e) {
        parsedEnfantColors = [];
      }
    }

    let parsedColors = [];
    if (colors) {
      try {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch (e) {
        parsedColors = [];
      }
    }

    let parsedSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
    if (sizes) {
      try {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      } catch (e) {
        parsedSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
      }
    }

    parsedVariantStock = filterVariantStock(
      parsedVariantStock,
      parsedSizes,
      safeParseJSON(colors, []),
      parsedEnfantSizes,
      parsedEnfantColors,
      isMatchyProduct
    );

    let existingImages = [];
    if (products[0].images) {
      try {
        if (typeof products[0].images === 'string') {
          try {
            existingImages = JSON.parse(products[0].images);
          } catch (parseError) {
            existingImages = products[0].images.startsWith('/') || products[0].images.startsWith('http') ? [products[0].images] : [];
          }
        } else {
          existingImages = products[0].images;
        }
      } catch (e) {
        existingImages = [];
      }
    }
    
    // Add new uploaded images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadToCloudinary = (fileBuffer) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'ecommerce-products',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            uploadStream.end(fileBuffer);
          });
        };
        
        const imageUrl = await uploadToCloudinary(file.buffer);
        existingImages.push(imageUrl);
      }
    }

    let totalStock = 0;
    if (parsedVariantStock && typeof parsedVariantStock === 'object') {
      totalStock = Object.values(parsedVariantStock).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    }

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, enfant_price = ?, category = ?, stock = ?, images = ?, sizes = ?, colors = ?, enfant_colors = ?, is_matchy_matchy = ?, enfant_sizes = ?, voilee = ? WHERE id = ?',
      [
        name,
        description,
        price,
        isMatchyProduct ? (enfantPrice || null) : null,
        category,
        totalStock,
        JSON.stringify(existingImages),
        JSON.stringify(parsedSizes),
        JSON.stringify(parsedColors),
        JSON.stringify(isMatchyProduct ? parsedEnfantColors : []),
        isMatchyProduct ? 1 : 0,
        JSON.stringify(isMatchyProduct ? parsedEnfantSizes : []),
        isMatchyProduct ? (voilee ? 1 : 0) : 0,
        id,
      ]
    );

    // Update product variants with individual stock levels
    await pool.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    
    if (parsedVariantStock && typeof parsedVariantStock === 'object') {
      for (const [key, stock] of Object.entries(parsedVariantStock)) {
        const { size, color } = parseVariantKey(key);
        await pool.query(
          'INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)',
          [id, size || null, color || null, parseInt(stock) || 0]
        );
      }
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
