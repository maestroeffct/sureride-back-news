import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminListCarsController,
  adminGetCarController,
  adminCreateCarController,
  adminUpdateCarController,
  adminApproveCarController,
  adminRejectCarController,
  adminFlagCarController,
  adminUnflagCarController,
  adminActivateCarController,
  adminDeactivateCarController,
} from "./admin.cars.controller";

const router = Router();

router.get("/cars", requireAdminAuth, adminListCarsController);
router.get("/cars/:carId", requireAdminAuth, adminGetCarController);

router.post("/cars", requireAdminAuth, adminCreateCarController);
router.patch("/cars/:carId", requireAdminAuth, adminUpdateCarController);

router.patch(
  "/cars/:carId/approve",
  requireAdminAuth,
  adminApproveCarController,
);
router.patch("/cars/:carId/reject", requireAdminAuth, adminRejectCarController);
router.patch("/cars/:carId/flag", requireAdminAuth, adminFlagCarController);
router.patch("/cars/:carId/unflag", requireAdminAuth, adminUnflagCarController);

router.patch(
  "/cars/:carId/activate",
  requireAdminAuth,
  adminActivateCarController,
);
router.patch(
  "/cars/:carId/deactivate",
  requireAdminAuth,
  adminDeactivateCarController,
);

export default router;
