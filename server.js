import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config(); // PRIMERO cargar variables

console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join-role', (rol) => {
        socket.join(rol);
    });
    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
});