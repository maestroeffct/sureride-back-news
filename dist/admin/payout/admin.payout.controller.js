"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpsertPayoutAccount = adminUpsertPayoutAccount;
exports.adminCreatePayout = adminCreatePayout;
exports.adminMarkPayoutPaid = adminMarkPayoutPaid;
const admin_payout_service_1 = require("./admin.payout.service");
async function adminUpsertPayoutAccount(req, res) {
    try {
        const { providerId } = req.params;
        const account = await (0, admin_payout_service_1.upsertProviderPayoutAccount)(providerId, req.body);
        return res.json({ message: "Payout account saved", account });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
async function adminCreatePayout(req, res) {
    try {
        const { providerId } = req.params;
        const { amount, note } = req.body;
        const payout = await (0, admin_payout_service_1.createPayout)(providerId, Number(amount), note);
        return res.json({ message: "Payout created", payout });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
async function adminMarkPayoutPaid(req, res) {
    try {
        const { payoutId } = req.params;
        const { reference } = req.body;
        const payout = await (0, admin_payout_service_1.markPayoutPaid)(payoutId, reference);
        return res.json({ message: "Payout marked as paid", payout });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
