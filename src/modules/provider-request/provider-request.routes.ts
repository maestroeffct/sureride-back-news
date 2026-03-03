import { Router } from "express";
import { submitProviderRequest } from "./provider-request.controller";

const router = Router();

// PUBLIC endpoint
router.post("/providers/request", submitProviderRequest);

export default router;
