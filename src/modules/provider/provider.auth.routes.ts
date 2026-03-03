import { Router } from "express";
import { loginProvider, logoutProvider } from "./provider.auth.controller";
import { requireProviderAuth } from "../../middleware/provider.middleware";

const router = Router();

router.post("/login", loginProvider);
router.post("/logout", requireProviderAuth, logoutProvider);

export default router;
