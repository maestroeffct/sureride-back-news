"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_auth_controller_1 = require("./admin.auth.controller");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = (0, express_1.Router)();
router.post("/login", admin_auth_controller_1.loginAdmin);
router.post("/logout", admin_middleware_1.requireAdminAuth, admin_auth_controller_1.logoutAdmin);
exports.default = router;
