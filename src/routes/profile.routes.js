import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleWare.js";
import { upload } from "../middleware/multer.js";
import {
  getProfile,
  createOrUpdateProfile,
  uploadLogo,
  uploadBanner,
  deleteProfile,
  getPublicProfile,
  updateStats
} from "../controllers/profile.controler.js";

const router = Router();

// Public routes
router.get("/public/:id", getPublicProfile);

// Protected routes (require authentication)
router.use(verifyJWT);

// User-specific profile routes
router.route("/")
  .get(getProfile)
  .post(createOrUpdateProfile)
  .delete(deleteProfile);

router.put("/stats", updateStats);

// File upload routes
router.post("/logo", 
  upload.single('logo'), 
  uploadLogo
);

router.post("/banner", 
  upload.single('banner'), 
  uploadBanner
);

export default router;