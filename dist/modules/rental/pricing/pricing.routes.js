"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pricing_controller_1 = require("./pricing.controller");
const router = (0, express_1.Router)();
router.post("/pricing-preview", pricing_controller_1.previewPrice);
exports.default = router;
