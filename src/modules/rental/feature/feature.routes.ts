import { Router } from "express";
import {
  createGlobalFeatureController,
  createProviderFeatureController,
  listProviderFeaturesController,
  attachFeaturesController,
  getCarWithFeaturesController,
} from "./feature.controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

/**
 * ADMIN ROUTES
 */
router.post("/admin/features", requireAuth, createGlobalFeatureController);

/**
 * PROVIDER ROUTES
 */
router.post("/provider/features", requireAuth, createProviderFeatureController);
router.get("/provider/features", requireAuth, listProviderFeaturesController);
router.post(
  "/provider/cars/:carId/features",
  requireAuth,
  attachFeaturesController,
);

/**
 * PUBLIC ROUTE
 */
router.get("/cars/:carId", getCarWithFeaturesController);

export default router;
