import { notificationService } from "../servise/notification.servise.js";
import { Notification } from "../models/notification.model.js";

export const notificationController = {
  /**
   * Get user notifications
   */
  async getNotifications(req, res) {
    try {
      console.log('📱 GET /notifications - User:', req.user.email);
      
      const userId = req.user._id;
      const { 
        limit = 20, 
        skip = 0, 
        unreadOnly, 
        types,
        priority 
      } = req.query;

      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true',
        types: types ? types.split(',') : [],
        priority: priority ? priority.split(',') : []
      };

      console.log('📋 Query options:', options);

      const result = await notificationService.getUserNotifications(userId, options);

      console.log(`✅ Found ${result.notifications.length} notifications, ${result.unreadCount} unread`);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error in getNotifications:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Get notification statistics
   */
  async getStats(req, res) {
    try {
      console.log('📊 GET /notifications/stats - User:', req.user.email);
      
      const userId = req.user._id;

      const userQuery = {
        $or: [
          { userIds: { $in: [userId] } },
          { userIds: { $size: 0 } },
          { userIds: { $exists: false } }
        ]
      };

      const [
        total,
        unread,
        highPriority,
        todayCount
      ] = await Promise.all([
        Notification.countDocuments(userQuery),
        
        Notification.countDocuments({
          ...userQuery,
          isRead: false
        }),
        
        Notification.countDocuments({
          ...userQuery,
          priority: 'HIGH'
        }),
        
        Notification.countDocuments({
          ...userQuery,
          createdAt: { 
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      ]);

      console.log('📈 User-specific stats:', { total, unread, highPriority, todayCount });

      res.status(200).json({
        success: true,
        data: {
          total: total || 0,
          unread: unread || 0,
          highPriority: highPriority || 0,
          todayCount: todayCount || 0
        }
      });
    } catch (error) {
      console.error('❌ Error in getStats:', error);
      res.status(200).json({
        success: true,
        data: {
          total: 0,
          unread: 0,
          highPriority: 0,
          todayCount: 0
        }
      });
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      console.log('📝 PATCH /notifications/:id/read');
      
      const { notificationId } = req.params;
      const userId = req.user._id;

      console.log(`📝 Marking notification ${notificationId} as read for user ${userId}`);

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      console.log('📝 PATCH /notifications/read-all - User:', req.user.email);
      
      const userId = req.user._id;

      const result = await notificationService.markAllAsRead(userId);

      console.log(`✅ Marked all notifications as read for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result
      });
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      console.log('🗑️ DELETE /notifications/:id');
      
      const { notificationId } = req.params;
      const userId = req.user._id;

      console.log(`🗑️ Attempting to delete notification ${notificationId} for user ${userId}`);

      const notification = await Notification.findById(notificationId);

      if (!notification) {
        console.log(`❌ Notification ${notificationId} not found`);
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.userIds.length > 0 && 
          !notification.userIds.some(id => id.toString() === userId.toString())) {
        console.log(`❌ User ${userId} not authorized to delete notification ${notificationId}`);
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this notification'
        });
      }

      await notification.deleteOne();

      console.log(`✅ Notification ${notificationId} deleted successfully`);

      res.status(200).json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Trigger manual inventory check
   */
  async checkInventoryAlerts(req, res) {
    try {
      console.log('🔍 POST /notifications/check-inventory');
      
      const lowStockAlerts = await notificationService.checkLowStockAlerts();
      const expiringAlerts = await notificationService.checkExpiringAlerts();
      const expiredAlerts = await notificationService.checkExpiredItems();

      console.log('✅ Inventory check completed:', {
        lowStock: lowStockAlerts.length,
        expiring: expiringAlerts.length,
        expired: expiredAlerts.length
      });

      res.status(200).json({
        success: true,
        data: {
          lowStockAlerts: lowStockAlerts.length,
          expiringAlerts: expiringAlerts.length,
          expiredAlerts: expiredAlerts.length,
          message: 'Inventory alerts checked successfully'
        }
      });
    } catch (error) {
      console.error('❌ Error in checkInventoryAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Debug endpoint to see notifications
   */
  async debugNotifications(req, res) {
    try {
      console.log('🔍 DEBUG: Checking notification system');
      
      const allNotifications = await Notification.find({}).sort({ createdAt: -1 });
      
      const schemaPaths = Object.keys(Notification.schema.paths || {});
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Debug information',
          totalCount: allNotifications.length,
          notifications: allNotifications,
          schemaPaths,
          user: {
            id: req.user._id,
            email: req.user.email
          }
        }
      });
    } catch (error) {
      console.error('❌ Debug error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Create test notification
   */
  async createTestNotification(req, res) {
    try {
      console.log('🧪 Creating test notification...');
      
      const testNotification = new Notification({
        type: 'PURCHASE_RECEIVED',
        title: 'Test Purchase Notification',
        message: 'Test purchase order PUR-TEST-123 has been received. Total: $100.00',
        priority: 'MEDIUM',
        userIds: [req.user._id],
        isRead: false,
        relatedEntity: {
          entityType: 'PURCHASE',
          entityId: req.user._id
        },
        actionUrl: `/purchases/test`,
        metadata: {
          invoiceNumber: 'PUR-TEST-123',
          supplierName: 'Test Supplier',
          totalAmount: 100.00,
          itemsCount: 5,
          action: 'RECEIVED'
        }
      });
      
      await testNotification.save();
      
      console.log('✅ Test notification created:', testNotification._id);
      
      res.status(201).json({
        success: true,
        message: 'Test notification created',
        data: testNotification
      });
    } catch (error) {
      console.error('❌ Test notification error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Test endpoint to check notifications visibility
   */
  async testNotificationsVisibility(req, res) {
    try {
      console.log('🔍 TEST: Checking notifications visibility for user:', req.user.email);
      
      const userId = req.user._id;
      
      const allNotifications = await Notification.find({}).sort({ createdAt: -1 });
      
      const userQuery = {
        $or: [
          { userIds: { $in: [userId] } },
          { userIds: { $size: 0 } },
          { userIds: { $exists: false } },
          { userIds: null }
        ]
      };
      
      const userNotifications = await Notification.find(userQuery).sort({ createdAt: -1 });
      
      const analysis = allNotifications.map(notification => {
        const isVisible = userNotifications.some(
          userNotif => userNotif._id.toString() === notification._id.toString()
        );
        
        let visibilityReason = '';
        if (notification.userIds && notification.userIds.length > 0) {
          const userInList = notification.userIds.some(
            id => id.toString() === userId.toString()
          );
          visibilityReason = userInList ? 
            'User is in userIds list' : 
            'User NOT in userIds list';
        } else if (notification.userIds && notification.userIds.length === 0) {
          visibilityReason = 'Global notification (empty userIds array)';
        } else if (!notification.userIds || notification.userIds === null) {
          visibilityReason = 'Global notification (no userIds field)';
        }
        
        return {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          userIds: notification.userIds,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          isVisible: isVisible,
          visibilityReason: visibilityReason
        };
      });
      
      console.log(`📊 TEST RESULTS:`);
      console.log(`   Total notifications in DB: ${allNotifications.length}`);
      console.log(`   Visible to user: ${userNotifications.length}`);
      console.log(`   Not visible: ${allNotifications.length - userNotifications.length}`);
      
      const problematic = analysis.filter(item => !item.isVisible);
      if (problematic.length > 0) {
        console.log('❌ Problematic notifications (not visible):');
        problematic.forEach(notif => {
          console.log(`   - ${notif.type}: ${notif.title}`);
          console.log(`     Reason: ${notif.visibilityReason}`);
          console.log(`     userIds: ${JSON.stringify(notif.userIds)}`);
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userId,
            email: req.user.email
          },
          summary: {
            totalInDatabase: allNotifications.length,
            visibleToUser: userNotifications.length,
            notVisible: allNotifications.length - userNotifications.length
          },
          analysis: analysis,
          allNotifications: allNotifications.map(n => ({
            id: n._id,
            type: n.type,
            title: n.title,
            userIds: n.userIds,
            isRead: n.isRead,
            createdAt: n.createdAt
          })),
          userNotifications: userNotifications.map(n => ({
            id: n._id,
            type: n.type,
            title: n.title,
            userIds: n.userIds,
            isRead: n.isRead,
            createdAt: n.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('❌ Error in testNotificationsVisibility:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};