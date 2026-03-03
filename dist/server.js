"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./env"); // MUST be first
const app_1 = __importDefault(require("./app"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const booking_cron_1 = require("./jobs/booking.cron");
app_1.default.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
(0, booking_cron_1.startBookingCron)();
const PORT = process.env.PORT || 4000;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
