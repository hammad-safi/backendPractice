import { Router } from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/user.controller.js"; // Fixed path
import { upload } from "../middleware/multer.js";
import { verifyJWT } from "../middleware/authMiddleWare.js";

const router = Router();

router.post(
  "/register",
 
  registerUser
);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
export default router;


