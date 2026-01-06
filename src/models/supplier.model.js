import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
}, { timestamps: true });

export const Supplier = mongoose.model("Supplier", supplierSchema);
