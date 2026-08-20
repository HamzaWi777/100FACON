import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateCartItem, validate } from '../validators/index.js';

const router = express.Router();

router.get('/', verifyToken, cartController.getCart);
router.post('/', verifyToken, validateCartItem, validate, cartController.addToCart);
router.put('/:id', verifyToken, cartController.updateCartItem);
router.delete('/:id', verifyToken, cartController.removeFromCart);

export default router;
