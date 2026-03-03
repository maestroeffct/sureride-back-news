"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDraftProvider = saveDraftProvider;
exports.finalizeProvider = finalizeProvider;
exports.getProviders = getProviders;
const provider_onboarding_service_1 = require("./provider.onboarding.service");
async function saveDraftProvider(req, res) {
    try {
        const provider = await (0, provider_onboarding_service_1.createOrUpdateDraftProvider)(req.body);
        return res.json(provider);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to save draft" });
    }
}
async function finalizeProvider(req, res) {
    try {
        const rawProviderId = req.params.providerId;
        const providerId = Array.isArray(rawProviderId)
            ? rawProviderId[0]
            : rawProviderId;
        if (!providerId) {
            return res.status(400).json({ message: "providerId is required" });
        }
        const provider = await (0, provider_onboarding_service_1.submitProvider)(providerId);
        return res.json({
            message: "Provider activated successfully",
            provider,
        });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
async function getProviders(req, res) {
    const providers = await (0, provider_onboarding_service_1.listProviders)();
    return res.json(providers);
}
