import { Router } from "express";
import { listLocations, searchLocationController } from "./location.controller";

const router = Router();

router.get("/search", searchLocationController);
router.get("/", listLocations);

export default router;
