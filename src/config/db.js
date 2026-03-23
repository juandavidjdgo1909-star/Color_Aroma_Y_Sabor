import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error conectando a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('Advertencia: MongoDB se ha desconectado');
});

mongoose.connection.on('error', (err) => {
    console.error(`Error crítico en la instancia de MongoDB: ${err}`);
});