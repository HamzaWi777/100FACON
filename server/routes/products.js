import express from 'express';
import * as productController from '../controllers/productController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { validateProduct, validateProductFilters, validate } from '../validators/index.js';

const router = express.Router();

// Public routes
router.get('/', validateProductFilters, validate, productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', verifyAdmin, uploadMiddleware.array('images', 15), validateProduct, validate, productController.createProduct);
router.put('/:id', verifyAdmin, uploadMiddleware.array('images', 15), validateProduct, validate, productController.updateProduct);
router.delete('/:id', verifyAdmin, productController.deleteProduct);

export default router;
