import { Router } from "express";
import {
  savePersonalInfo,
  saveAddressInfo,
  uploadDocuments,
} from "./kyc.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload";

const router = Router();

router.post("/personal", requireAuth, savePersonalInfo);
router.post("/address", requireAuth, saveAddressInfo);

router.post(
  "/documents",
  requireAuth,
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "govFront", maxCount: 1 },
    { name: "govBack", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  uploadDocuments,
);

export default router;
