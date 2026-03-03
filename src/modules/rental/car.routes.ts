import { Router } from "express";
import { listCars, searchCars } from "./car.controller";

const router = Router();

router.post("/search", searchCars);
router.get("/cars", listCars);

export default router;
