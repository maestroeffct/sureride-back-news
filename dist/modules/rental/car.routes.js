"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const car_controller_1 = require("./car.controller");
const router = (0, express_1.Router)();
router.post("/search", car_controller_1.searchCars);
router.get("/cars", car_controller_1.listCars);
exports.default = router;
