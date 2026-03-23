import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI no está definida en las variables de entorno");
        }

        const conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB conectado: ${conn.connection.host} ✅`);
    } catch (error) {
        console.error(`Error conectando a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('MongoDB conectado correctamente 🚀');
});

mongoose.connection.on('disconnected', () => {
    console.warn('Advertencia: MongoDB se ha desconectado ⚠️');
});

mongoose.connection.on('error', (err) => {
    console.error(`Error crítico en MongoDB: ${err}`);
});