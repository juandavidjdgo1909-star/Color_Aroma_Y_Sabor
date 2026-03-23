import Order from '../models/order.js';

export const getDashboardStats = async () => {
    const [ventasRes, conteoRes, topRes] = await Promise.all([
        // Ingresos totales de pedidos entregados
        Order.aggregate([
            { $match: { estado: 'Entregado' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        // Conteo por estado
        Order.aggregate([
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]),
        // Top 5 platos más pedidos
        Order.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.platoId', totalVendido: { $sum: '$items.cantidad' } } },
            { $sort: { totalVendido: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'plato' } },
            { $unwind: { path: '$plato', preserveNullAndEmptyArrays: true } },
            { $project: { nombre: '$plato.nombre', totalVendido: 1 } }
        ])
    ]);

    const conteo = {};
    conteoRes.forEach(c => { conteo[c._id] = c.count; });

    return {
        ingresosTotales: ventasRes[0]?.total || 0,
        pedidosPorEstado: {
            Pendiente:  conteo['Pendiente']  || 0,
            Preparando: conteo['Preparando'] || 0,
            Listo:      conteo['Listo']      || 0,
            Entregado:  conteo['Entregado']  || 0,
            Cancelado:  conteo['Cancelado']  || 0,
        },
        totalPedidos: Object.values(conteo).reduce((a, b) => a + b, 0),
        topPlatos: topRes,
    };
};
