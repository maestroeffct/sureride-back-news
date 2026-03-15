"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDraftProvider = saveDraftProvider;
exports.finalizeProvider = finalizeProvider;
exports.getProviders = getProviders;
exports.getProvider = getProvider;
const provider_onboarding_service_1 = require("./provider.onboarding.service");
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
async function saveDraftProvider(req, res) {
    try {
        const provider = await (0, provider_onboarding_service_1.createOrUpdateDraftProvider)(req.body);
        return res.json(provider);
    }
    catch (err) {
        if (err.message === "NAME_AND_EMAIL_REQUIRED") {
            return res.status(400).json({ message: "Name and email are required" });
        }
        console.error(err);
        return res.status(500).json({ message: "Failed to save draft" });
    }
}
async function finalizeProvider(req, res) {
    try {
        const providerId = getSingleParam(req.params.providerId);
        if (!providerId) {
            return res.status(400).json({ message: "providerId is required" });
        }
        const provider = await (0, provider_onboarding_service_1.submitProvider)(providerId);
        return res.json({
            message: "Provider submitted for admin approval",
            provider,
        });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
async function getProviders(req, res) {
    try {
        const providers = await (0, provider_onboarding_service_1.listProviders)({
            q: getQueryString(req.query.q),
            status: getQueryString(req.query.status),
            createdBy: getQueryString(req.query.createdBy),
            page: getQueryNumber(req.query.page),
            limit: getQueryNumber(req.query.limit),
        });
        return res.json(providers);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch providers" });
    }
}
async function getProvider(req, res) {
    try {
        const providerId = getSingleParam(req.params.providerId);
        if (!providerId) {
            return res.status(400).json({ message: "providerId is required" });
        }
        const provider = await (0, provider_onboarding_service_1.getProviderById)(providerId);
        return res.json(provider);
    }
    catch (err) {
        if (err.message === "PROVIDER_NOT_FOUND") {
            return res.status(404).json({ message: "Provider not found" });
        }
        return res.status(400).json({ message: err.message });
    }
}
