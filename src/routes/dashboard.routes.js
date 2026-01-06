import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleWare.js";
import express from "express";
import { getInventory, addInventory, updateInventory, deleteInventory } from "../controllers/inventory.controller.js";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "../controllers/supllier.controller.js";
import { getPurchases, addPurchase, deletePurchases } from "../controllers/purchase.controllers.js";
import { getSales, addSale, deleteSales } from "../controllers/sales.controller.js";
const router = express.Router();

router.get("/dashboard", verifyJWT, (req, res) => {
  res.json({
    success: true,
    message: "Protected dashboard",
    user: req.user,
  });
});





export default router;
