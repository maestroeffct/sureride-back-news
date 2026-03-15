import { Router } from "express";
import { requireProviderAuth } from "../../../middleware/provider.middleware";
import {
  providerCreateCarController,
  providerUpdateCarController,
  providerSubmitCarController,
  providerUploadCarImagesController,
  providerDeleteCarImageController,
  providerAttachCarFeaturesController,
} from "./provider.cars.controller";
import { carImageUpload } from "./provider.cars.upload";

const router = Router();

router.post("/cars", requireProviderAuth, providerCreateCarController);
router.patch("/cars/:carId", requireProviderAuth, providerUpdateCarController);

// Submit to moderation
router.patch(
  "/cars/:carId/submit",
  requireProviderAuth,
  providerSubmitCarController,
);

// Images
router.post(
  "/cars/:carId/images",
  requireProviderAuth,
  carImageUpload.array("images", 10),
  providerUploadCarImagesController,
);

router.delete(
  "/cars/:carId/images/:imageId",
  requireProviderAuth,
  providerDeleteCarImageController,
);

// Features
router.post(
  "/cars/:carId/features",
  requireProviderAuth,
  providerAttachCarFeaturesController,
);

export default router;
