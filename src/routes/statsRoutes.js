import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/', verifyToken, checkRole(['Admin']), getStats);

export default router;
