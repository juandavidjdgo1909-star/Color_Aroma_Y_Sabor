export const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({
                status: 'error',
                message: 'Error interno: verifyToken debe ejecutarse antes que checkRole'
            });
        }
        const { rol } = req.user;
        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({
                status: 'error',
                message: `Permisos insuficientes. Se requiere rol: ${rolesPermitidos.join(' o ')}`
            });
        }
        next();
    };
};
