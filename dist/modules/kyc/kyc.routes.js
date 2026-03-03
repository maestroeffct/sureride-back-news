"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kyc_controller_1 = require("./kyc.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const upload_1 = require("../../middleware/upload");
const router = (0, express_1.Router)();
router.post("/personal", auth_middleware_1.requireAuth, kyc_controller_1.savePersonalInfo);
router.post("/address", auth_middleware_1.requireAuth, kyc_controller_1.saveAddressInfo);
router.post("/documents", auth_middleware_1.requireAuth, upload_1.upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "govFront", maxCount: 1 },
    { name: "govBack", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
]), kyc_controller_1.uploadDocuments);
exports.default = router;
