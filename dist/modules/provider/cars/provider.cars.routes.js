"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_middleware_1 = require("../../../middleware/provider.middleware");
const provider_cars_controller_1 = require("./provider.cars.controller");
const provider_cars_upload_1 = require("./provider.cars.upload");
const router = (0, express_1.Router)();
router.post("/cars", provider_middleware_1.requireProviderAuth, provider_cars_controller_1.providerCreateCarController);
router.patch("/cars/:carId", provider_middleware_1.requireProviderAuth, provider_cars_controller_1.providerUpdateCarController);
// Submit to moderation
router.patch("/cars/:carId/submit", provider_middleware_1.requireProviderAuth, provider_cars_controller_1.providerSubmitCarController);
// Images
router.post("/cars/:carId/images", provider_middleware_1.requireProviderAuth, provider_cars_upload_1.carImageUpload.array("images", 10), provider_cars_controller_1.providerUploadCarImagesController);
router.delete("/cars/:carId/images/:imageId", provider_middleware_1.requireProviderAuth, provider_cars_controller_1.providerDeleteCarImageController);
// Features
router.post("/cars/:carId/features", provider_middleware_1.requireProviderAuth, provider_cars_controller_1.providerAttachCarFeaturesController);
exports.default = router;
