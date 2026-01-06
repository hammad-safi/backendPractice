// routes/notification.routes.js
import express from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/authMiddleWare.js"; // Use verifyJWT

const router = express.Router();

// All routes are protected with verifyJWT
router.get("/", verifyJWT, notificationController.getNotifications);
router.get("/stats", verifyJWT, notificationController.getStats);
router.patch("/:notificationId/read", verifyJWT, notificationController.markAsRead);
router.patch("/read-all", verifyJWT, notificationController.markAllAsRead);
router.delete("/:notificationId", verifyJWT, notificationController.deleteNotification);
router.post("/check-inventory", verifyJWT, notificationController.checkInventoryAlerts);
router.get("/debug", verifyJWT, notificationController.debugNotifications);
router.post("/test", verifyJWT, notificationController.createTestNotification);
router.get("/test-visibility", verifyJWT, notificationController.testNotificationsVisibility);

export default router;