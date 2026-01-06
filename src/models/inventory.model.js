import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  expiry: { type: Date, required: true },
}, { timestamps: true });

export const Inventory = mongoose.model("Inventory", inventorySchema);
// models/inventory.model.js
// import mongoose from "mongoose";

// const inventorySchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true },

//   batchNumber: { type: String, required: true },
//   expiry: { type: Date, required: true },

//   stock: { type: Number, default: 0 },
//   costPrice: { type: Number, default: 0 },
//   salePrice: { type: Number, default: 0 },
// }, { timestamps: true });

// // prevent duplicate batch for same product
// inventorySchema.index({ name: 1, batchNumber: 1 }, { unique: true });

// export const Inventory = mongoose.model("Inventory", inventorySchema);
