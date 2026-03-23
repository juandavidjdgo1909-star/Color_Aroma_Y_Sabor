import { Router } from 'express';
import * as invCtrl from '../controllers/inventoryController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/',    verifyToken, checkRole(['Admin']), invCtrl.getInventory);
router.post('/',   verifyToken, checkRole(['Admin']), invCtrl.createIngredient);
router.patch('/:id',  verifyToken, checkRole(['Admin']), invCtrl.updateStock);
router.delete('/:id', verifyToken, checkRole(['Admin']), invCtrl.deleteIngredient);

export default router;
