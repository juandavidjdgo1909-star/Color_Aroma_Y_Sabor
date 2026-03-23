import { Router } from 'express';
import { body } from 'express-validator';
import * as userCtrl from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { checkRole } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(verifyToken, checkRole(['Admin']));

router.get('/', userCtrl.getUsers);

router.post('/', [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2 }).withMessage('Mínimo 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').isIn(['Admin', 'Mesero', 'Chef']).withMessage('Rol inválido'),
    validate
], userCtrl.createUser);

router.patch('/:id', [
    body('nombre').optional().trim().isLength({ min: 2 }).withMessage('Mínimo 2 caracteres'),
    body('rol').optional().isIn(['Admin', 'Mesero', 'Chef']).withMessage('Rol inválido'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validate
], userCtrl.updateUser);

router.delete('/:id', userCtrl.deleteUser);

export default router;
