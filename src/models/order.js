import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
    meseroId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mesa: {
        type: Number,
        min: 1,
        default: 1
    },
    items: [{
        platoId: {
            type: Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        cantidad: {
            type: Number,
            default: 1
        }
    }],
    total: {
        type: Number,
        required: true,
        default: 0
    },
    estado: {
        type: String,
        required: true,
        enum: ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'],
        default: 'Pendiente'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true,
    versionKey: false
});

orderSchema.post('save', function (doc) {
    console.log(`ORDEN ACTUALIZADA: ID ${doc._id} cambio a estado: ${doc.estado}`);
});

orderSchema.index({estado: 1});
export default model('Order', orderSchema);