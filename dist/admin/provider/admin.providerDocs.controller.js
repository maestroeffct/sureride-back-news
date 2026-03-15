"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListProviderDocs = adminListProviderDocs;
exports.adminApproveDoc = adminApproveDoc;
exports.adminRejectDoc = adminRejectDoc;
const admin_providerDocs_service_1 = require("./admin.providerDocs.service");
function getSingleParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
async function adminListProviderDocs(req, res) {
    const providerId = getSingleParam(req.params.providerId);
    if (!providerId) {
        return res.status(400).json({ message: "providerId is required" });
    }
    const docs = await (0, admin_providerDocs_service_1.listProviderDocuments)(providerId);
    return res.json(docs);
}
async function adminApproveDoc(req, res) {
    try {
        const docId = getSingleParam(req.params.docId);
        if (!docId) {
            return res.status(400).json({ message: "docId is required" });
        }
        const doc = await (0, admin_providerDocs_service_1.approveProviderDocument)(docId);
        return res.json({ message: "Document approved", doc });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
async function adminRejectDoc(req, res) {
    try {
        const docId = getSingleParam(req.params.docId);
        if (!docId) {
            return res.status(400).json({ message: "docId is required" });
        }
        const { reason } = req.body;
        if (!reason)
            return res.status(400).json({ message: "Reason required" });
        const doc = await (0, admin_providerDocs_service_1.rejectProviderDocument)(docId, reason);
        return res.json({ message: "Document rejected", doc });
    }
    catch (e) {
        return res.status(400).json({ message: e.message });
    }
}
