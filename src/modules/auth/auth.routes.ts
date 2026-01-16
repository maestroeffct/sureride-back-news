import { Router } from "express";
import {
  login,
  register,
  resendOtpHandler,
  verifyOtpHandler,
} from "./auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post("/verify-otp", verifyOtpHandler);
router.post("/resend-otp", resendOtpHandler);

export default router;
