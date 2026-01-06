import { Router } from "express";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier
} from "../controllers/supllier.controller.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

const router = Router();

router.use(verifyJWT); // all routes require login

// ✅ Corrected routes (remove "/supplier" prefix since it's already in app.js)
router.get("/", getSuppliers);
router.post("/", addSupplier);
router.put("/:id", updateSupplier);
router.delete("/", deleteSupplier);

export default router;