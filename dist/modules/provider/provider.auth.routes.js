"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_auth_controller_1 = require("./provider.auth.controller");
const provider_middleware_1 = require("../../middleware/provider.middleware");
const router = (0, express_1.Router)();
router.post("/login", provider_auth_controller_1.loginProvider);
router.post("/logout", provider_middleware_1.requireProviderAuth, provider_auth_controller_1.logoutProvider);
exports.default = router;
