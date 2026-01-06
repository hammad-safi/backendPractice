// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: [
//       'INVENTORY_LOW_STOCK',
//       'INVENTORY_EXPIRING_SOON',
//       'INVENTORY_EXPIRED',
//       'PURCHASE_RECEIVED',
//       'SALE_COMPLETED',
//       'SYSTEM_ALERT',
//       'DAILY_SUMMARY'
//     ],
//     required: true
//   },
//   title: {
//     type: String,
//     required: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   priority: {
//     type: String,
//     enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
//     default: 'MEDIUM'
//   },
//   relatedEntity: {
//     entityType: {
//       type: String,
//       enum: ['INVENTORY', 'PURCHASE', 'SALE', 'USER', 'SYSTEM']
//     },
//     entityId: {
//       type: mongoose.Schema.Types.ObjectId
//     }
//   },
//   userIds: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
//   }],
//   readBy: [{
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },
//     readAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   isRead: {
//     type: Boolean,
//     default: false
//   },
//   actionUrl: String,
//   metadata: mongoose.Schema.Types.Mixed,
//   expiresAt: Date
// }, {
//   timestamps: true
// });

// // Indexes for faster queries
// notificationSchema.index({ type: 1, createdAt: -1 });
// notificationSchema.index({ isRead: 1, createdAt: -1 });
// notificationSchema.index({ userIds: 1, createdAt: -1 });
// notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// export const Notification = mongoose.model("Notification", notificationSchema);

// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'INVENTORY_LOW_STOCK',
      'INVENTORY_EXPIRING_SOON',
      'INVENTORY_EXPIRED',
      'PURCHASE_RECEIVED',
      'SALE_COMPLETED',
      'SYSTEM_ALERT',
      'DAILY_SUMMARY'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['INVENTORY', 'PURCHASE', 'SALE', 'USER', 'SYSTEM']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  userIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ userIds: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model("Notification", notificationSchema);

