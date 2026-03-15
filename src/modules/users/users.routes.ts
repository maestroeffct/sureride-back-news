import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";

import {
  getMeController,
  updateMeController,
  updatePasswordController,
  deleteMeController,
} from "./users.controller";

const router = Router();

router.get("/me", requireAuth, getMeController);

router.patch("/me", requireAuth, updateMeController);

router.patch("/me/password", requireAuth, updatePasswordController);

router.delete("/me", requireAuth, deleteMeController);

export default router;
