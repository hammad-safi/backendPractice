// jobs/notificationJobs.js
import cron from 'node-cron';
import { notificationService } from '../servise/notification.servise.js';

// Run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily notification checks...');
  
  try {
    // Check all inventory alerts
    await notificationService.checkLowStockAlerts();
    await notificationService.checkExpiringAlerts();
    await notificationService.checkExpiredItems();
    
    // Generate daily summary
    await notificationService.generateDailySummary();
    
    console.log('Daily notification checks completed');
  } catch (error) {
    console.error('Error in daily notification checks:', error);
  }
});

// Run every hour for critical checks
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly inventory checks...');
  
  try {
    // Check for critical alerts (expiring in less than 3 days)
    await notificationService.checkExpiringAlerts(3);
    console.log('Hourly inventory checks completed');
  } catch (error) {
    console.error('Error in hourly inventory checks:', error);
  }
});

// Cleanup old notifications weekly
cron.schedule('0 0 * * 0', async () => {
  console.log('Cleaning up old notifications...');
  
  try {
    const result = await notificationService.cleanupOldNotifications();
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
});