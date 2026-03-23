import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            data: { id: user._id }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        res.status(401).json({ status: 'error', message: error.message });
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { nombre, password } = req.body;
        const updateData = {};

        if (nombre) updateData.nombre = nombre.trim();
        if (password) updateData.password = await bcrypt.hash(password, 10);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: 'error', message: 'No hay datos para actualizar' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            status: 'success',
            data: user,
            message: 'Perfil actualizado correctamente'
        });
    } catch (error) {
        next(error);
    }
};
