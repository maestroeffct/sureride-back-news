import { Router } from "express";
import { loginAdmin, logoutAdmin } from "./admin.auth.controller";
import { requireAdminAuth } from "../middleware/admin.middleware";

const router = Router();

router.post("/login", loginAdmin);
router.post("/logout", requireAdminAuth, logoutAdmin);

export default router;
