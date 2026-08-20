import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyAdmin, userController.getAllUsers);

export default router;
