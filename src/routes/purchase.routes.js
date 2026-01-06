// routes/purchase.routes.js
import { Router } from "express";
import {
  getPurchases,
  addPurchase,
  deletePurchases,
  getPurchase,
  updatePurchaseStatus,
  getPurchaseLengthLast30Days
  // Remove getPurchaseStats if it doesn't exist
} from "../controllers/purchase.controllers.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getPurchases);
router.post("/", addPurchase);
router.delete("/", deletePurchases);
router.get("/:id", getPurchase);
router.patch("/:id/status", updatePurchaseStatus);
router.get("/purchases/count/last-30-days", getPurchaseLengthLast30Days);

// Remove or comment out the stats route if the function doesn't exist
// router.get("/stats", getPurchaseStats);
// In your purchase.routes.js, add this BEFORE router.use(verifyJWT)
router.post("/debug-test", (req, res) => {
  console.log("=== DEBUG TEST ENDPOINT ===");
  console.log("Request body:", req.body);
  console.log("Headers:", req.headers);
  console.log("Auth header:", req.headers.authorization);
  
  res.json({
    success: true,
    message: "Debug endpoint working",
    body: req.body,
    headers: {
      authorization: req.headers.authorization,
      'content-type': req.headers['content-type']
    }
  });
});
export default router;