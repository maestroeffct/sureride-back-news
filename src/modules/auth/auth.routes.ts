import { Router } from "express";
import {
  forgotPasswordHandler,
  getMe,
  login,
  logout,
  register,
  resendForgotPassword,
  resendOtpHandler,
  resetPasswordHandler,
  verifyOtpHandler,
  verifyResetOtpHandler,
} from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post("/verify-otp", verifyOtpHandler);
router.post("/resend-otp", resendOtpHandler);

router.get("/me", requireAuth, getMe);

router.post("/forgot-password", forgotPasswordHandler);
router.post("/verify-reset-otp", verifyResetOtpHandler);
router.post("/reset-password", resetPasswordHandler);

router.post("/forgot-password/resend", resendForgotPassword);

router.post("/logout", requireAuth, logout);
export default router;
