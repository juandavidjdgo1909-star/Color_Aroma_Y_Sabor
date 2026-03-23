import {Schema, model} from 'mongoose';

const menuItemSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del plato es obligatorio'],
        trim: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    categoria: {
        type: String,
        required: true,
        enum: ['Entradas', 'Platos fuertes', 'Bebidas', 'Postres']
    },
    ingredientes: [{
        ingredienteId: {
            type: Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        cantidad: {
            type: Number,
            required: true
        }
    }],
    imageUrl: {
        type: String,
        default: ''
    },
    disponible: {
        type: Boolean,
        default: true
    }
},{timestamps: true});

export default model('MenuItem', menuItemSchema);