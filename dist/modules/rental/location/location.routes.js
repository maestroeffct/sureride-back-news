"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("./location.controller");
const router = (0, express_1.Router)();
router.get("/search", location_controller_1.searchLocationController);
router.get("/", location_controller_1.listLocations);
exports.default = router;
