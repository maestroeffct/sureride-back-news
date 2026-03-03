"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitProviderRequest = submitProviderRequest;
const provider_request_service_1 = require("./provider-request.service");
async function submitProviderRequest(req, res) {
    try {
        const { businessName, email, phone } = req.body;
        if (!businessName || !email) {
            return res.status(400).json({
                message: "Business name and email are required",
            });
        }
        const request = await (0, provider_request_service_1.createProviderRequest)({
            businessName,
            email,
            phone,
        });
        return res.status(201).json({
            message: "Request submitted successfully. We will contact you.",
            request,
        });
    }
    catch (err) {
        if (err.message === "REQUEST_ALREADY_EXISTS") {
            return res.status(400).json({
                message: "A pending request already exists for this email",
            });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
