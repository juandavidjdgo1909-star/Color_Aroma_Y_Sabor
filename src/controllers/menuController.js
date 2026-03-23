import MenuItem from '../models/menuItem.js';

export const getMenu = async (req, res, next) => {
    try {
        const menu = await MenuItem.find({ disponible: true })
            .select('nombre precio categoria disponible')
            .sort({ categoria: 1, nombre: 1 });
        res.status(200).json({ status: 'success', data: menu });
    } catch (error) {
        next(error);
    }
};


export const getAllDishes = async (req, res, next) => {
    try {
        const dishes = await MenuItem.find()
            .select('nombre precio categoria disponible ingredientes')
            .sort({ categoria: 1, nombre: 1 });
        res.status(200).json({ status: 'success', data: dishes });
    } catch (error) {
        next(error);
    }
};


export const createDish = async (req, res, next) => {
    try {
        const dish = await MenuItem.create(req.body);
        res.status(201).json({ status: 'success', data: dish });
    } catch (error) {
        next(error);
    }
};


export const updateDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dish = await MenuItem.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!dish) return res.status(404).json({ status: 'error', message: 'Plato no encontrado' });
        res.status(200).json({ status: 'success', data: dish });
    } catch (error) {
        next(error);
    }
};


export const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dish = await MenuItem.findByIdAndDelete(id);
        if (!dish) return res.status(404).json({ status: 'error', message: 'Plato no encontrado' });
        res.status(200).json({ status: 'success', message: 'Plato eliminado' });
    } catch (error) {
        next(error);
    }
};
