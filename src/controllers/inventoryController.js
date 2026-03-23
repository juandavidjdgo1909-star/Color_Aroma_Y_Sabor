import Ingredient from '../models/ingredient.js';

export const getInventory = async (req, res, next) => {
    try {
        const ingredients = await Ingredient.find().sort({ nombre: 1 });
        res.json(ingredients);
    } catch (error) {
        next(error);
    }
};

export const createIngredient = async (req, res, next) => {
    try {
        const nuevoIngrediente = new Ingredient(req.body);
        await nuevoIngrediente.save();
        res.status(201).json(nuevoIngrediente);
    } catch (error) {
        next(error);
    }
};

export const updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stock, minStock, nombre, categoria, unidad } = req.body;

        const camposActualizar = {};
        if (stock    !== undefined) camposActualizar.stock    = Number(stock);
        if (minStock !== undefined) camposActualizar.minStock = Number(minStock);
        if (nombre)                 camposActualizar.nombre   = nombre.trim();
        if (categoria)              camposActualizar.categoria = categoria.trim();
        if (unidad)                 camposActualizar.unidad   = unidad.trim();

        const ingrediente = await Ingredient.findByIdAndUpdate(
            id,
            { $set: camposActualizar },
            { new: true, runValidators: true }
        );

        if (!ingrediente) {
            return res.status(404).json({ status: 'error', message: 'Ingrediente no encontrado' });
        }

        res.json({ status: 'success', data: ingrediente });
    } catch (error) {
        next(error);
    }
};

export const deleteIngredient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ingrediente = await Ingredient.findByIdAndDelete(id);
        if (!ingrediente) {
            return res.status(404).json({ status: 'error', message: 'Ingrediente no encontrado' });
        }
        res.json({ status: 'success', message: 'Ingrediente eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
