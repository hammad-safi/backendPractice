// models/sales.model.js - COMPLETE FIXED VERSION
import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  inventoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Inventory",
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  total: { 
    type: Number, 
    required: true 
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    unique: true,
    default: () => `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`
  },
  items: [saleItemSchema],
  subtotal: { 
    type: Number, 
    required: true 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  tax: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'UPI', 'Credit'], 
    default: 'Cash' 
  },
  customerName: { 
    type: String, 
    default: 'Walk-in Customer' 
  },
  customerPhone: { 
    type: String 
  },
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { timestamps: true });

export const Sale = mongoose.model("Sale", saleSchema);