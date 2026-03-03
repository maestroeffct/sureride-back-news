import { Router } from "express";
import { previewPrice } from "./pricing.controller";

const router = Router();

router.post("/pricing-preview", previewPrice);

export default router;
