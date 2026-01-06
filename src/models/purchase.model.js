// models/purchase.model.js
import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Inventory" 
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
  unitCost: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalCost: { 
    type: Number, 
    required: true 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  batchNumber: { 
    type: String 
  }
}, { _id: true });

const purchaseSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    unique: true,
    default: function() {
      return `PUR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
  },
  supplierName: { 
    type: String,  
  },
  supplierContact: { 
    type: String 
  },
  items: [purchaseItemSchema],
  totalQuantity: { 
    type: Number, 
    required: true 
  },
  subtotal: { 
    type: Number, 
    required: true 
  },
  tax: { 
    type: Number, 
    default: 0 
  },
  taxAmount: { 
    type: Number, 
    default: 0 
  },
  shippingCost: { 
    type: Number, 
    default: 0 
  },
  otherCharges: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Bank Transfer', 'Credit', 'Cheque', 'Online', 'Other'], 
    default: 'Cash' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Paid'], 
    default: 'Paid' 
  },
  purchaseDate: { 
    type: Date, 
    default: Date.now 
  },
  expectedDelivery: { 
    type: Date 
  },
  notes: { 
    type: String 
  },
  receivedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Received', 'Partial', 'Cancelled'], 
    default: 'Received' 
  }
}, { 
  timestamps: true
});

// Inventory update hook
purchaseSchema.post('save', async function(doc) {
  try {
    console.log('📦 Updating inventory stocks...');
    
    for (const item of doc.items) {
      if (item.productId) {
        // Update inventory stock
        await mongoose.model('Inventory').findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        console.log(`✅ Updated inventory ${item.productId}, added ${item.quantity} units`);
      }
    }
    
    console.log('✅ Inventory update completed');
  } catch (error) {
    console.error('❌ Error updating inventory:', error.message);
  }
});

// Notification hook
purchaseSchema.post('save', async function(doc) {
  try {
    console.log('🔔 Purchase post-save hook triggered for purchase:', doc._id);
    console.log('📦 Invoice number:', doc.invoiceNumber);
    console.log('👤 Received by:', doc.receivedBy);
    
    // Import notification service dynamically to avoid circular dependencies
    const { notificationService } = await import('../servise/notification.servise.js');
    
    // Create purchase notification
    const notification = await notificationService.createPurchaseNotification(doc._id, 'RECEIVED');
    console.log('✅ Purchase notification created:', notification._id);
    
    // Check for low stock alerts after inventory update
    console.log('🔍 Checking low stock alerts...');
    await notificationService.checkLowStockAlerts();
    
  } catch (error) {
    console.error('❌ Error in purchase post-save hook:', error.message);
    console.error('📝 Error stack:', error.stack);
    // Don't throw error to prevent purchase creation from failing
  }
});

export const Purchase = mongoose.model("Purchase", purchaseSchema);