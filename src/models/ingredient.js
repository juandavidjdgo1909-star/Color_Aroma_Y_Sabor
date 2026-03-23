import { Schema, model } from "mongoose";

export const ingredientSchema = new Schema(
  {
    nombre: { type: String, required: true },
    categoria: { type: String, required: true },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    unidad: { type: String, required: true },
  },
  { timestamps: true },
);

export default model("Ingredient", ingredientSchema);
