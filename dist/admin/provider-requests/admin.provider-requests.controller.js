"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListProviderRequests = adminListProviderRequests;
exports.adminApproveProviderRequest = adminApproveProviderRequest;
exports.adminRejectProviderRequest = adminRejectProviderRequest;
const admin_provider_requests_service_1 = require("./admin.provider-requests.service");
function getSingleParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
function getQueryString(value) {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && typeof value[0] === "string")
        return value[0];
    return undefined;
}
function getQueryNumber(value) {
    const parsed = Number(getQueryString(value));
    return Number.isFinite(parsed) ? parsed : undefined;
}
async function adminListProviderRequests(req, res) {
    const requests = await (0, admin_provider_requests_service_1.listProviderRequests)({
        q: getQueryString(req.query.q),
        status: getQueryString(req.query.status),
        page: getQueryNumber(req.query.page),
        limit: getQueryNumber(req.query.limit),
    });
    return res.json(requests);
}
async function adminApproveProviderRequest(req, res) {
    try {
        const id = getSingleParam(req.params.id);
        if (!id) {
            return res.status(400).json({ message: "id is required" });
        }
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
        const id = getSingleParam(req.params.id);
        if (!id) {
            return res.status(400).json({ message: "id is required" });
        }
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
