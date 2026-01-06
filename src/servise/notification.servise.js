// import { Notification } from "../models/notification.model.js";
// import { Inventory } from "../models/inventory.model.js";
// import { Purchase } from "../models/purchase.model.js";
// import mongoose from "mongoose";

// class NotificationService {
//   /**
//    * Check inventory levels and generate low stock alerts
//    */
//   async checkLowStockAlerts(threshold = 10) {
//     try {
//       const lowStockItems = await Inventory.find({
//         stock: { $lte: threshold },
//         category: { $ne: 'Non-Medical' } // Optional: exclude non-medical items
//       });

//       const alerts = [];

//       for (const item of lowStockItems) {
//         // Check if notification already exists in last 24 hours
//         const existingAlert = await Notification.findOne({
//           'relatedEntity.entityId': item._id,
//           type: 'INVENTORY_LOW_STOCK',
//           createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
//         });

//         if (!existingAlert) {
//           const notification = await Notification.create({
//             type: 'INVENTORY_LOW_STOCK',
//             title: 'Low Stock Alert',
//             message: `${item.name} is running low. Current stock: ${item.stock}`,
//             priority: item.stock <= 5 ? 'HIGH' : 'MEDIUM',
//             relatedEntity: {
//               entityType: 'INVENTORY',
//               entityId: item._id
//             },
//             actionUrl: `/inventory/${item._id}`,
//             metadata: {
//               currentStock: item.stock,
//               threshold: threshold,
//               category: item.category,
//               expiry: item.expiry
//             }
//           });
//           alerts.push(notification);
//         }
//       }

//       return alerts;
//     } catch (error) {
//       console.error('Error checking low stock alerts:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check for expiring items
//    */
//   async checkExpiringAlerts(daysThreshold = 30) {
//     try {
//       const thresholdDate = new Date();
//       thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

//       const expiringItems = await Inventory.find({
//         expiry: { $lte: thresholdDate, $gte: new Date() },
//         stock: { $gt: 0 }
//       });

//       const alerts = [];

//       for (const item of expiringItems) {
//         const daysUntilExpiry = Math.ceil((item.expiry - new Date()) / (1000 * 60 * 60 * 24));
        
//         // Create notification based on urgency
//         let priority = 'MEDIUM';
//         let message = '';
        
//         if (daysUntilExpiry <= 7) {
//           priority = 'CRITICAL';
//           message = `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!`;
//         } else if (daysUntilExpiry <= 30) {
//           priority = 'HIGH';
//           message = `${item.name} expires in ${daysUntilExpiry} days`;
//         }

//         // Check if notification already exists
//         const existingAlert = await Notification.findOne({
//           'relatedEntity.entityId': item._id,
//           type: 'INVENTORY_EXPIRING_SOON',
//           createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Check last 7 days
//         });

//         if (!existingAlert && priority !== 'MEDIUM') {
//           const notification = await Notification.create({
//             type: 'INVENTORY_EXPIRING_SOON',
//             title: 'Expiry Alert',
//             message: message,
//             priority: priority,
//             relatedEntity: {
//               entityType: 'INVENTORY',
//               entityId: item._id
//             },
//             actionUrl: `/inventory/${item._id}`,
//             metadata: {
//               expiryDate: item.expiry,
//               daysUntilExpiry: daysUntilExpiry,
//               currentStock: item.stock
//             },
//             expiresAt: item.expiry // Auto-delete after expiry
//           });
//           alerts.push(notification);
//         }
//       }

//       return alerts;
//     } catch (error) {
//       console.error('Error checking expiring alerts:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check for expired items
//    */
//   async checkExpiredItems() {
//     try {
//       const expiredItems = await Inventory.find({
//         expiry: { $lt: new Date() },
//         stock: { $gt: 0 }
//       });

//       const alerts = [];

//       for (const item of expiredItems) {
//         // Check if notification already exists
//         const existingAlert = await Notification.findOne({
//           'relatedEntity.entityId': item._id,
//           type: 'INVENTORY_EXPIRED',
//           createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
//         });

//         if (!existingAlert) {
//           const notification = await Notification.create({
//             type: 'INVENTORY_EXPIRED',
//             title: 'Expired Item',
//             message: `${item.name} has expired. Remove from sale.`,
//             priority: 'CRITICAL',
//             relatedEntity: {
//               entityType: 'INVENTORY',
//               entityId: item._id
//             },
//             actionUrl: `/inventory/${item._id}`,
//             metadata: {
//               expiryDate: item.expiry,
//               currentStock: item.stock
//             }
//           });
//           alerts.push(notification);
//         }
//       }

//       return alerts;
//     } catch (error) {
//       console.error('Error checking expired items:', error);
//       throw error;
//     }
//   }

//   /**
//    * Generate purchase order notifications
//    */
//   async createPurchaseNotification(purchaseId, action = 'RECEIVED') {
//     try {
//       const purchase = await Purchase.findById(purchaseId)
//         .populate('items.productId', 'name stock');

//       if (!purchase) {
//         throw new Error('Purchase not found');
//       }

//       const notification = await Notification.create({
//         type: 'PURCHASE_RECEIVED',
//         title: `Purchase ${purchase.invoiceNumber} ${action}`,
//         message: `Purchase order ${purchase.invoiceNumber} has been ${action.toLowerCase()}. Total: $${purchase.grandTotal}`,
//         priority: 'MEDIUM',
//         relatedEntity: {
//           entityType: 'PURCHASE',
//           entityId: purchase._id
//         },
//         actionUrl: `/purchases/${purchase._id}`,
//         metadata: {
//           invoiceNumber: purchase.invoiceNumber,
//           supplierName: purchase.supplierName,
//           totalAmount: purchase.grandTotal,
//           itemsCount: purchase.items.length,
//           action: action
//         }
//       });

//       return notification;
//     } catch (error) {
//       console.error('Error creating purchase notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get notifications for user
//    */
//  // In notificationService.js, update getUserNotifications method
// async getUserNotifications(userId, options = {}) {
//   try {
//     console.log('🔍 Getting notifications for user:', userId);
    
//     const {
//       limit = 50,
//       skip = 0,
//       unreadOnly = false,
//       types = [],
//       priority = []
//     } = options;

//     // FIX: Handle both old and new notification formats
//     const query = {
//       $or: [
//         // Case 1: Notification has userIds array with this user
//         { userIds: { $in: [userId] } },
//         // Case 2: Notification has userIds but it's empty (global)
//         { userIds: { $size: 0 } },
//         // Case 3: Notification has no userIds field (backward compatibility)
//         { userIds: { $exists: false } },
//         // Case 4: New format - single user field
//         { user: userId },
//         // Case 5: New format - global (user is null)
//         { user: null }
//       ]
//     };

//     console.log('📝 Query:', JSON.stringify(query, null, 2));

//     if (unreadOnly) {
//       query.isRead = false;
//     }

//     if (types.length > 0) {
//       query.type = { $in: types };
//     }

//     if (priority.length > 0) {
//       query.priority = { $in: priority };
//     }

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1, priority: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Notification.countDocuments(query);
//     const unreadCount = await Notification.countDocuments({
//       ...query,
//       isRead: false
//     });

//     console.log(`✅ Found ${notifications.length} notifications, ${unreadCount} unread`);

//     return {
//       notifications,
//       total,
//       unreadCount
//     };
//   } catch (error) {
//     console.error('Error getting user notifications:', error);
//     throw error;
//   }
// }

//   /**
//    * Mark notification as read
//    */
//   async markAsRead(notificationId, userId) {
//     try {
//       const notification = await Notification.findById(notificationId);

//       if (!notification) {
//         throw new Error('Notification not found');
//       }

//       // Check if already read by this user
//       const alreadyRead = notification.readBy.some(
//         read => read.userId.toString() === userId.toString()
//       );

//       if (!alreadyRead) {
//         notification.readBy.push({
//           userId: userId,
//           readAt: new Date()
//         });

//         // Mark as read if all targeted users have read it
//         if (notification.userIds.length > 0) {
//           const allUsersRead = notification.userIds.every(userId =>
//             notification.readBy.some(read => read.userId.toString() === userId.toString())
//           );
//           notification.isRead = allUsersRead;
//         } else {
//           notification.isRead = true;
//         }

//         await notification.save();
//       }

//       return notification;
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//       throw error;
//     }
//   }

//   /**
//    * Mark all notifications as read for user
//    */
//   async markAllAsRead(userId) {
//     try {
//       const result = await Notification.updateMany(
//         {
//           $or: [
//             { userIds: { $in: [userId] } },
//             { userIds: { $size: 0 } }
//           ],
//           isRead: false
//         },
//         {
//           $addToSet: {
//             readBy: {
//               userId: userId,
//               readAt: new Date()
//             }
//           },
//           isRead: true
//         }
//       );

//       return result;
//     } catch (error) {
//       console.error('Error marking all as read:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete old notifications (cleanup job)
//    */
//   async cleanupOldNotifications(daysToKeep = 90) {
//     try {
//       const cutoffDate = new Date();
//       cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

//       const result = await Notification.deleteMany({
//         createdAt: { $lt: cutoffDate },
//         priority: { $ne: 'CRITICAL' } // Keep critical notifications
//       });

//       return result;
//     } catch (error) {
//       console.error('Error cleaning up old notifications:', error);
//       throw error;
//     }
//   }

//   /**
//    * Daily inventory summary notification
//    */
//   async generateDailySummary() {
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);

//       // Get low stock items
//       const lowStockCount = await Inventory.countDocuments({
//         stock: { $lte: 10 }
//       });

//       // Get items expiring in next 7 days
//       const expiringSoon = await Inventory.countDocuments({
//         expiry: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }
//       });

//       // Get today's purchases
//       const todayPurchases = await Purchase.countDocuments({
//         purchaseDate: { $gte: today, $lt: tomorrow }
//       });

//       const notification = await Notification.create({
//         type: 'DAILY_SUMMARY',
//         title: 'Daily Inventory Summary',
//         message: `Today's summary: ${lowStockCount} low stock items, ${expiringSoon} items expiring soon, ${todayPurchases} new purchases.`,
//         priority: 'LOW',
//         relatedEntity: {
//           entityType: 'SYSTEM'
//         },
//         metadata: {
//           lowStockCount,
//           expiringSoon,
//           todayPurchases,
//           date: today
//         }
//       });

//       return notification;
//     } catch (error) {
//       console.error('Error generating daily summary:', error);
//       throw error;
//     }
//   }
// }

// export const notificationService = new NotificationService();

// services/notificationService.js
// src/services/notificationService.js
import { Notification } from "../models/notification.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Purchase } from "../models/purchase.model.js";
import mongoose from "mongoose";

class NotificationService {
  /**
   * Check inventory levels and generate low stock alerts
   */
  async checkLowStockAlerts(threshold = 10) {
    try {
      const lowStockItems = await Inventory.find({
        stock: { $lte: threshold },
        category: { $ne: 'Non-Medical' } // Optional: exclude non-medical items
      });

      const alerts = [];

      for (const item of lowStockItems) {
        // Check if notification already exists in last 24 hours
        const existingAlert = await Notification.findOne({
          'relatedEntity.entityId': item._id,
          type: 'INVENTORY_LOW_STOCK',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingAlert) {
          const notification = new Notification({
            type: 'INVENTORY_LOW_STOCK',
            title: 'Low Stock Alert',
            message: `${item.name} is running low. Current stock: ${item.stock}`,
            priority: item.stock <= 5 ? 'HIGH' : 'MEDIUM',
            userIds: [],
            isRead: false,
            relatedEntity: {
              entityType: 'INVENTORY',
              entityId: item._id
            },
            actionUrl: `/inventory/${item._id}`,
            metadata: {
              currentStock: item.stock,
              threshold: threshold,
              category: item.category,
              expiry: item.expiry
            }
          });
          await notification.save();
          alerts.push(notification);
          console.log(`⚠️ Created low stock alert for: ${item.name} (Stock: ${item.stock})`);
        }
      }

      console.log(`✅ Created ${alerts.length} low stock alerts`);
      return alerts;
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Check for expiring items
   */
  async checkExpiringAlerts(daysThreshold = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      const expiringItems = await Inventory.find({
        expiry: { $lte: thresholdDate, $gte: new Date() },
        stock: { $gt: 0 }
      });

      const alerts = [];

      for (const item of expiringItems) {
        const daysUntilExpiry = Math.ceil((item.expiry - new Date()) / (1000 * 60 * 60 * 24));
        
        let priority = 'MEDIUM';
        let message = '';
        
        if (daysUntilExpiry <= 7) {
          priority = 'CRITICAL';
          message = `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!`;
        } else if (daysUntilExpiry <= 30) {
          priority = 'HIGH';
          message = `${item.name} expires in ${daysUntilExpiry} days`;
        }

        // Check if notification already exists
        const existingAlert = await Notification.findOne({
          'relatedEntity.entityId': item._id,
          type: 'INVENTORY_EXPIRING_SOON',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        if (!existingAlert && priority !== 'MEDIUM') {
          const notification = new Notification({
            type: 'INVENTORY_EXPIRING_SOON',
            title: 'Expiry Alert',
            message: message,
            priority: priority,
            userIds: [],
            isRead: false,
            relatedEntity: {
              entityType: 'INVENTORY',
              entityId: item._id
            },
            actionUrl: `/inventory/${item._id}`,
            metadata: {
              expiryDate: item.expiry,
              daysUntilExpiry: daysUntilExpiry,
              currentStock: item.stock
            },
            expiresAt: item.expiry
          });

          await notification.save();
          alerts.push(notification);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking expiring alerts:', error);
      throw error;
    }
  }

  /**
   * Check for expired items
   */
  async checkExpiredItems() {
    try {
      const expiredItems = await Inventory.find({
        expiry: { $lt: new Date() },
        stock: { $gt: 0 }
      });

      const alerts = [];

      for (const item of expiredItems) {
        // Check if notification already exists
        const existingAlert = await Notification.findOne({
          'relatedEntity.entityId': item._id,
          type: 'INVENTORY_EXPIRED',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        if (!existingAlert) {
          const notification = new Notification({
            type: 'INVENTORY_EXPIRED',
            title: 'Expired Item',
            message: `${item.name} has expired. Remove from sale.`,
            priority: 'CRITICAL',
            userIds: [],
            isRead: false,
            relatedEntity: {
              entityType: 'INVENTORY',
              entityId: item._id
            },
            actionUrl: `/inventory/${item._id}`,
            metadata: {
              expiryDate: item.expiry,
              currentStock: item.stock
            }
          });

          await notification.save();
          alerts.push(notification);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking expired items:', error);
      throw error;
    }
  }

  /**
   * Generate purchase order notifications
   */
  async createPurchaseNotification(purchaseId, action = 'RECEIVED') {
    try {
      const purchase = await Purchase.findById(purchaseId)
        .populate('items.productId', 'name category');

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      const metadata = {
        invoiceNumber: purchase.invoiceNumber,
        supplierName: purchase.supplierName,
        totalAmount: purchase.grandTotal,
        itemsCount: purchase.items.length,
        action: action
      };

      const notification = new Notification({
        type: 'PURCHASE_RECEIVED',
        title: `Purchase Order ${action}`,
        message: `Purchase order ${purchase.invoiceNumber} from ${purchase.supplierName} has been ${action.toLowerCase()}. Total: $${purchase.grandTotal.toFixed(2)}`,
        priority: 'MEDIUM',
        userIds: [],
        isRead: false,
        relatedEntity: {
          entityType: 'PURCHASE',
          entityId: purchase._id
        },
        actionUrl: `/purchases/${purchase._id}`,
        metadata: metadata
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating purchase notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if already read by this user
      const alreadyRead = notification.readBy?.some(
        read => read.userId.toString() === userId.toString()
      ) || false;

      if (!alreadyRead) {
        if (!notification.readBy) {
          notification.readBy = [];
        }
        
        notification.readBy.push({
          userId: userId,
          readAt: new Date()
        });

        // Mark as read if all targeted users have read it
        if (notification.userIds && notification.userIds.length > 0) {
          const allUsersRead = notification.userIds.every(userId =>
            notification.readBy.some(read => read.userId.toString() === userId.toString())
          );
          notification.isRead = allUsersRead;
        } else {
          notification.isRead = true;
        }

        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          $or: [
            { userIds: { $in: [userId] } },
            { userIds: { $size: 0 } },
            { userIds: { $exists: false } }
          ],
          isRead: false
        },
        {
          $addToSet: {
            readBy: {
              userId: userId,
              readAt: new Date()
            }
          },
          isRead: true
        }
      );

      return result;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options) {
    const { limit, skip, unreadOnly, types, priority } = options;

    const query = {
      $or: [
        { userIds: { $in: [userId] } },
        { userIds: { $size: 0 } },
        { userIds: { $exists: false } }
      ]
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    if (types.length > 0) {
      query.type = { $in: types };
    }

    if (priority.length > 0) {
      query.priority = { $in: priority };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Notification.countDocuments(query),
      
      Notification.countDocuments({
        ...query,
        isRead: false
      })
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: skip + notifications.length < total
    };
  }

  /**
   * Cleanup old notifications
   */
  async cleanupOldNotifications(days = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    return await Notification.deleteMany({
      createdAt: { $lt: thresholdDate },
      isRead: true
    });
  }

  /**
   * Generate daily summary
   */
  async generateDailySummary() {
    // Implement if needed
    return null;
  }
}

export const notificationService = new NotificationService();