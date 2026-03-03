"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminApproveProvider = adminApproveProvider;
exports.adminSuspendProvider = adminSuspendProvider;
exports.adminSetCommission = adminSetCommission;
const admin_providers_service_1 = require("./admin.providers.service");
async function adminApproveProvider(req, res) {
    try {
        const { providerId } = req.params;
        const provider = await (0, admin_providers_service_1.approveProvider)(providerId);
        return res.json({ message: "Provider approved", provider });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
async function adminSuspendProvider(req, res) {
    try {
        const { providerId } = req.params;
        const { reason } = req.body;
        const provider = await (0, admin_providers_service_1.suspendProvider)(providerId, reason);
        return res.json({ message: "Provider suspended", provider });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
async function adminSetCommission(req, res) {
    try {
        const { providerId } = req.params;
        const { commissionRate } = req.body;
        const provider = await (0, admin_providers_service_1.setProviderCommission)(providerId, Number(commissionRate));
        return res.json({ message: "Commission updated", provider });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
