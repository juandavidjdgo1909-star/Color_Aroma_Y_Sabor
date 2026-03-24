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
        const plato = await MenuItem.findById(item.platoId);
        if (!plato || !plato.disponible) {
            throw new Error(`Plato no disponible: ${item.platoId}`);
        }

        let precioItem = plato.precio;
        const ingredientesParaGuardar = [];

        if (plato.esPersonalizable && item.ingredientesSeleccionados?.length) {
            // Burrito/producto personalizable: verificar y descontar solo ingredientes elegidos
            for (const sel of item.ingredientesSeleccionados) {
                const selId = String(sel.ingredienteId);
                const opt = plato.ingredientesOpcionales?.find(
                    o => String(o.ingredienteId?._id || o.ingredienteId) === selId
                );
                if (!opt) continue;

                const ingrediente = await Ingredient.findById(sel.ingredienteId);
                if (!ingrediente) continue;

                const cantidadPorPorcion = opt.cantidad ?? 1;
                const cantidadNecesaria = cantidadPorPorcion * item.cantidad;
                if (ingrediente.stock < cantidadNecesaria) {
                    throw new Error(`Insumos insuficientes: ${ingrediente.nombre} para ${plato.nombre}`);
                }
                ingrediente.stock -= cantidadNecesaria;
                await ingrediente.save();

                precioItem += opt.precioExtra;
                ingredientesParaGuardar.push({
                    ingredienteId: ingrediente._id,
                    nombre: ingrediente.nombre,
                    precioExtra: opt.precioExtra,
                });
            }
        } else if (plato.ingredientes?.length) {
            // Plato con receta fija
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
        }

        subtotal += precioItem * item.cantidad;
        itemsParaOrden.push({
            platoId: plato._id,
            cantidad: item.cantidad,
            ...(ingredientesParaGuardar.length ? { ingredientesSeleccionados: ingredientesParaGuardar } : {}),
        });
    }

    return await Order.create({
        meseroId,
        mesa: Number(mesa) || 1,
        items: itemsParaOrden,
        total: parseFloat(subtotal.toFixed(2)),
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
