"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_request_controller_1 = require("./provider-request.controller");
const router = (0, express_1.Router)();
// PUBLIC endpoint
router.post("/providers/request", provider_request_controller_1.submitProviderRequest);
exports.default = router;
