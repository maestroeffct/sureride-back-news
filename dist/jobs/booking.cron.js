"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBookingCron = startBookingCron;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../prisma");
function startBookingCron() {
    // Runs every 10 minutes
    node_cron_1.default.schedule("*/10 * * * *", async () => {
        console.log("Running booking completion job...");
        await prisma_1.prisma.booking.updateMany({
            where: {
                status: "CONFIRMED",
                returnAt: {
                    lt: new Date(),
                },
            },
            data: {
                status: "COMPLETED",
            },
        });
        console.log("Booking auto-completion check done.");
    });
}
