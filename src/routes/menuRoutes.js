import { Router } from 'express';
import * as menuCtrl from '../controllers/menuController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/',    verifyToken, menuCtrl.getMenu);       // solo disponibles (Mesero)

router.get('/all', verifyToken, checkRole(['Admin']), menuCtrl.getAllDishes);
router.post('/',   verifyToken, checkRole(['Admin']), menuCtrl.createDish);
router.patch('/:id', verifyToken, checkRole(['Admin']), menuCtrl.updateDish);
router.delete('/:id', verifyToken, checkRole(['Admin']), menuCtrl.deleteDish);

export default router;
