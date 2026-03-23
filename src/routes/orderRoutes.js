import { Router } from 'express';
import * as orderCtrl from '../controllers/orderController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';

const router = Router();

router.post('/', verifyToken, checkRole(['Mesero']), orderCtrl.createOrder);
router.get('/', verifyToken, orderCtrl.getAllOrders);
router.patch('/:id', verifyToken, checkRole(['Chef', 'Mesero']), orderCtrl.updateStatus);

export default router;