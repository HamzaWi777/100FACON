import { body, param, query, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Auth validators
export const validateRegister = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('wilaya').trim().notEmpty().withMessage('Wilaya is required'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Product validators
export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  // variantStock is optional and handled in the controller
];

// Cart validators
export const validateCartItem = [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('size').trim().notEmpty().withMessage('Size is required'),
  body('color').trim().notEmpty().withMessage('Color is required'),
];

// Order validators
export const validateOrder = [
  body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('wilaya').trim().notEmpty().withMessage('Wilaya is required'),
];

export const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

// Pagination validators
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Filter validators
export const validateProductFilters = [
  query('category').optional().trim(),
  query('minPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Valid minimum price required'),
  query('maxPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Valid maximum price required'),
  query('search').optional().trim(),
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'newest'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];