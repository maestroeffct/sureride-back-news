"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListProviderRequests = adminListProviderRequests;
exports.adminApproveProviderRequest = adminApproveProviderRequest;
exports.adminRejectProviderRequest = adminRejectProviderRequest;
const admin_provider_requests_service_1 = require("./admin.provider-requests.service");
async function adminListProviderRequests(req, res) {
    const requests = await (0, admin_provider_requests_service_1.listProviderRequests)();
    return res.json(requests);
}
async function adminApproveProviderRequest(req, res) {
    try {
        const { id } = req.params;
        const provider = await (0, admin_provider_requests_service_1.approveProviderRequest)(id);
        return res.json({
            message: "Provider request approved",
            provider,
        });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
async function adminRejectProviderRequest(req, res) {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;
        const request = await (0, admin_provider_requests_service_1.rejectProviderRequest)(id, adminNote);
        return res.json({
            message: "Provider request rejected",
            request,
        });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
