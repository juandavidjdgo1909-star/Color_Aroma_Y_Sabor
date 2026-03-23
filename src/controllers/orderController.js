import * as orderService from '../services/orderService.js';

export const createOrder = async (req, res, next) => {
    try {
        const order = await orderService.createOrder(req.body.items, req.user.id, req.body.mesa);

        const io = req.app.get('io');
        if (io) {
            io.to('Chef').emit('new-order', order);
            io.to('Admin').emit('order-updated', order);
        }

        res.status(201).json({ status: 'success', data: order });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const updatedOrder = await orderService.updateOrderStatus(id, estado);

        const io = req.app.get('io');
        if (io) {
            io.to('Chef').emit('order-updated', updatedOrder);
            io.to('Mesero').emit('order-updated', updatedOrder);
            io.to('Admin').emit('order-updated', updatedOrder);
        }

        res.status(200).json({ status: 'success', data: updatedOrder });
    } catch (error) {
        next(error);
    }
};

export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getAllOrders();
        res.status(200).json({ status: 'success', data: orders });
    } catch (error) {
        next(error);
    }
};
