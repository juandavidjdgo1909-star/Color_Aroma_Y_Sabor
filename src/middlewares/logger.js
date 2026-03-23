export const requestLogger = (req, res, next) => {
    const date = new Date().toLocaleDateString();
    const { method, url, ip} = req;
    res.on('finish', () => {
        console.log(`(${date}) METODO: ${method} | RUTA: ${url} | IP: ${ip} | STATUS: ${res.statusCode}`);
    });
    next();
};