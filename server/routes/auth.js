import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateRegister, validateLogin, validateChangePassword, validate } from '../validators/index.js';

const router = express.Router();

router.post('/register', validateRegister, validate, authController.register);
router.post('/login', validateLogin, validate, authController.login);
router.get('/me', verifyToken, authController.getCurrentUser);
router.put('/change-password', verifyToken, validateChangePassword, validate, authController.changePassword);

export default router;
