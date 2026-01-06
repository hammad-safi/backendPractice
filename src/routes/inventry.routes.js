import { Router } from "express";
import {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory
} from "../controllers/inventory.controller.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

const router = Router();

// ✅ Remove this if you want some routes public, or keep for all protected
// router.use(verifyJWT);

// ✅ CORRECT ROUTE PATHS
router.get("/", verifyJWT, getInventory);           // GET /api/v1/inventory
router.post("/", verifyJWT, addInventory);          // POST /api/v1/inventory
router.put("/:id", verifyJWT, updateInventory);     // PUT /api/v1/inventory/:id
router.delete("/", verifyJWT, deleteInventory);     // DELETE /api/v1/inventory

export default router;