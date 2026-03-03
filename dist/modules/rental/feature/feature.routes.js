"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feature_controller_1 = require("./feature.controller");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * ADMIN ROUTES
 */
router.post("/admin/features", auth_middleware_1.requireAuth, feature_controller_1.createGlobalFeatureController);
/**
 * PROVIDER ROUTES
 */
router.post("/provider/features", auth_middleware_1.requireAuth, feature_controller_1.createProviderFeatureController);
router.get("/provider/features", auth_middleware_1.requireAuth, feature_controller_1.listProviderFeaturesController);
router.post("/provider/cars/:carId/features", auth_middleware_1.requireAuth, feature_controller_1.attachFeaturesController);
/**
 * PUBLIC ROUTE
 */
router.get("/cars/:carId", feature_controller_1.getCarWithFeaturesController);
exports.default = router;
