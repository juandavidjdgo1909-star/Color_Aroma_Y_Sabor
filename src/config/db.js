import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        console.log("URI usada para Mongo:", uri);

        if (!uri) {
            throw new Error("MONGO_URI no está definida");
        }

        await mongoose.connect(uri);

        console.log("MongoDB conectado correctamente ✅");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error.message);
    }
};