import { getDashboardStats } from '../services/statsService.js';

export const getStats = async (req, res, next) => {
    try {
        const stats = await getDashboardStats();
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        next(error);
    }
};
