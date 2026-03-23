import Order from '../models/order.js';
import MenuItem from '../models/menuItem.js';
import Ingredient from '../models/ingredient.js';

export const createOrder = async (items, meseroId, mesa = 1) => {
    if (!items || items.length === 0) {
        throw new Error('El pedido debe contener al menos un item');
    }

    let subtotal = 0;
    const itemsParaOrden = [];

    for (const item of items) {
        // Sin populate — evita el error con el modelo 'Inventory' no registrado
        const plato = await MenuItem.findById(item.platoId);
        if (!plato || !plato.disponible) {
            throw new Error(`Plato no disponible: ${item.platoId}`);
        }

        // Verificar y descontar stock de ingredientes (si el plato los tiene configurados)
        for (const receta of plato.ingredientes) {
            const ingrediente = await Ingredient.findById(receta.ingredienteId);
            if (!ingrediente) continue;

            const cantidadNecesaria = receta.cantidad * item.cantidad;
            if (ingrediente.stock < cantidadNecesaria) {
                throw new Error(`Insumos insuficientes para preparar: ${plato.nombre}`);
            }
            ingrediente.stock -= cantidadNecesaria;
            await ingrediente.save();
        }

        subtotal += plato.precio * item.cantidad;
        itemsParaOrden.push({ platoId: plato._id, cantidad: item.cantidad });
    }

    const totalConPropina = subtotal * 1.10;

    return await Order.create({
        meseroId,
        mesa: Number(mesa) || 1,
        items: itemsParaOrden,
        total: parseFloat(totalConPropina.toFixed(2)),
        estado: 'Pendiente'
    });
};

export const getAllOrders = async () => {
    return await Order.find()
        .populate('meseroId', 'nombre rol')
        .populate('items.platoId', 'nombre precio')
        .sort({ createdAt: -1 });
};

export const getOrdersByStatus = async (estado) => {
    return await Order.find({ estado })
        .populate('meseroId', 'nombre')
        .populate('items.platoId', 'nombre precio')
        .sort({ createdAt: -1 });
};

export const updateOrderStatus = async (orderId, nuevoEstado) => {
    const validStates = ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'];
    if (!validStates.includes(nuevoEstado)) {
        throw new Error(`Estado no válido. Valores aceptados: ${validStates.join(', ')}`);
    }
    return await Order.findByIdAndUpdate(
        orderId,
        { estado: nuevoEstado },
        { new: true }
    ).populate('meseroId', 'nombre');
};
