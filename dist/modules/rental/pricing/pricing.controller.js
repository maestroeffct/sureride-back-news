"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewPrice = previewPrice;
const pricing_service_1 = require("./pricing.service");
async function previewPrice(req, res) {
    try {
        const result = await (0, pricing_service_1.calculateDailyPrice)(req.body);
        res.json({
            message: "Price calculated",
            data: result,
        });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
