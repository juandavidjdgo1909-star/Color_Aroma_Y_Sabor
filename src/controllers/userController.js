import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ status: 'error', message: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ nombre, email, password: hashedPassword, rol });

        const { password: _, ...userData } = user.toObject();
        res.status(201).json({ status: 'success', data: userData, message: 'Usuario creado exitosamente' });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, rol, password } = req.body;

        const updateData = {};
        if (nombre)   updateData.nombre = nombre;
        if (rol)      updateData.rol    = rol;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        res.status(200).json({ status: 'success', data: user, message: 'Usuario actualizado' });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({ status: 'error', message: 'No puedes eliminar tu propio usuario' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        res.status(200).json({ status: 'success', message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};
