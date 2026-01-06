// import { Router } from "express";
// import {
//   getSales,
//   addSale,
//   deleteSales,
// } from "../controllers/sales.controller.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

// const router = Router();

// router.use(verifyJWT); // all routes require login

// // ✅ Corrected routes (remove "/sale" prefix since it's already in app.js)
// router.get("/", getSales);
// router.post("/", addSale);
// router.delete("/", deleteSales);

// export default router;

import express from 'express';
import {
  getSales,
  addSale,
  getInvoice,
  getInvoiceByNumber,
  generatePdfInvoice,
  deleteSales,
  getSalesStats
} from '../controllers/sales.controller.js';
// import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// GET routes
router.get('/', getSales); // Get all sales with filters
router.get('/stats', getSalesStats); // Get sales statistics
router.get('/invoice/:id', getInvoice); // Get invoice by ID
router.get('/invoice/number/:invoiceNumber', getInvoiceByNumber); // Get invoice by invoice number
router.get('/invoice/:id/pdf', generatePdfInvoice); // Generate PDF invoice

// POST routes
router.post('/', addSale); // Create new sale

// DELETE routes
router.delete('/', deleteSales); // Delete sales

export default router;