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
import {
  adminCreateCarMetaBrandController,
  adminCreateCarMetaCategoryController,
  adminCreateCarMetaModelController,
  adminImportCarMetaBrandsController,
  adminImportCarMetaCategoriesController,
  adminImportCarMetaModelsController,
  adminListCarMetaBrandsController,
  adminListCarMetaCategoriesController,
  adminListCarMetaModelsController,
  adminUpdateCarMetaBrandController,
  adminUpdateCarMetaCategoryController,
  adminUpdateCarMetaModelController,
} from "./admin.cars.meta.controller";

const router = Router();

router.get(
  "/cars/meta/categories",
  requireAdminAuth,
  adminListCarMetaCategoriesController,
);
router.post(
  "/cars/meta/categories/import",
  requireAdminAuth,
  adminImportCarMetaCategoriesController,
);
router.post(
  "/cars/meta/categories",
  requireAdminAuth,
  adminCreateCarMetaCategoryController,
);
router.patch(
  "/cars/meta/categories/:categoryId",
  requireAdminAuth,
  adminUpdateCarMetaCategoryController,
);

router.get("/cars/meta/brands", requireAdminAuth, adminListCarMetaBrandsController);
router.post(
  "/cars/meta/brands/import",
  requireAdminAuth,
  adminImportCarMetaBrandsController,
);
router.post("/cars/meta/brands", requireAdminAuth, adminCreateCarMetaBrandController);
router.patch(
  "/cars/meta/brands/:brandId",
  requireAdminAuth,
  adminUpdateCarMetaBrandController,
);

router.get("/cars/meta/models", requireAdminAuth, adminListCarMetaModelsController);
router.post(
  "/cars/meta/models/import",
  requireAdminAuth,
  adminImportCarMetaModelsController,
);
router.post("/cars/meta/models", requireAdminAuth, adminCreateCarMetaModelController);
router.patch(
  "/cars/meta/models/:modelId",
  requireAdminAuth,
  adminUpdateCarMetaModelController,
);

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
