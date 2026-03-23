import { Router } from 'express';
import { body } from 'express-validator';
import * as authCtrl from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register', [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2 }).withMessage('Mínimo 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').isIn(['Admin', 'Mesero', 'Chef']).withMessage('Rol inválido: debe ser Admin, Mesero o Chef'),
    validate
], authCtrl.register);

router.post('/login', [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
    validate
], authCtrl.login);

router.patch('/profile', verifyToken, [
    body('nombre').optional().trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validate
], authCtrl.updateProfile);

export default router;
