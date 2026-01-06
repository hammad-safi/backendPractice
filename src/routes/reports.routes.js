import express from "express";
import {
  getSalesSummary,
  getInventorySummary,
  getPurchasesSummary,
  getFinancialSummary,
  getDashboardSummary
} from "../controllers/reports.controller.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Dashboard summary
router.route("/dashboard").get(getDashboardSummary);

// Sales reports
router.route("/sales").get(getSalesSummary);

// Inventory reports
router.route("/inventory").get(getInventorySummary);

// Purchases reports
router.route("/purchases").get(getPurchasesSummary);

// Financial reports
router.route("/financial").get(getFinancialSummary);

// Comprehensive report (all in one)
router.route("/comprehensive").get(async (req, res) => {
  // This would combine all reports into one
  // Implementation depends on your specific needs
});

export default router;