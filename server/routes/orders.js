import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { verifyToken, verifyTokenOptional, verifyAdmin } from '../middleware/auth.js';
import { validateOrder, validateOrderStatus, validate } from '../validators/index.js';

const router = express.Router();

// User and guest routes
router.post('/', verifyTokenOptional, validateOrder, validate, orderController.createOrder);
router.get('/my-orders', verifyToken, orderController.getUserOrders);
router.get('/details/:id', verifyTokenOptional, orderController.getOrderById);

// Admin routes
router.get('/', verifyAdmin, orderController.getAllOrders);
router.put('/:id/status', verifyAdmin, validateOrderStatus, validate, orderController.updateOrderStatus);

export default router;
