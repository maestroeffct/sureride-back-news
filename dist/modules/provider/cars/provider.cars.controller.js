"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerCreateCarController = providerCreateCarController;
exports.providerUpdateCarController = providerUpdateCarController;
exports.providerSubmitCarController = providerSubmitCarController;
exports.providerUploadCarImagesController = providerUploadCarImagesController;
exports.providerDeleteCarImageController = providerDeleteCarImageController;
exports.providerAttachCarFeaturesController = providerAttachCarFeaturesController;
const zod_1 = require("zod");
const provider_cars_validation_1 = require("./provider.cars.validation");
const provider_cars_service_1 = require("./provider.cars.service");
function zodFail(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
function getSingleParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
function getRequiredParam(req, res, paramName) {
    const value = getSingleParam(req.params[paramName]);
    if (!value) {
        res.status(400).json({ message: `${paramName} is required` });
        return undefined;
    }
    return value;
}
function getAuthenticatedProviderId(req, res) {
    const providerId = req.user?.providerId;
    if (!providerId) {
        res.status(401).json({ message: "Unauthorized" });
        return undefined;
    }
    return providerId;
}
async function providerCreateCarController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const body = provider_cars_validation_1.providerCreateCarSchema.parse(req.body);
        const car = await (0, provider_cars_service_1.providerCreateCar)(providerId, body);
        return res.status(201).json({ message: "Car created", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "LOCATION_NOT_FOUND")
            return res.status(404).json({ message: "Location not found" });
        if (err.message === "LOCATION_NOT_OWNED")
            return res
                .status(403)
                .json({ message: "Location not owned by provider" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function providerUpdateCarController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const carId = getRequiredParam(req, res, "carId");
        if (!carId)
            return;
        const body = provider_cars_validation_1.providerUpdateCarSchema.parse(req.body);
        const car = await (0, provider_cars_service_1.providerUpdateCar)(providerId, carId, body);
        return res.json({ message: "Car updated", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "FORBIDDEN")
            return res.status(403).json({ message: "Not your car" });
        if (err.message === "CAR_FLAGGED")
            return res
                .status(403)
                .json({ message: "Car is flagged. Contact support." });
        if (err.message === "LOCATION_NOT_FOUND")
            return res.status(404).json({ message: "Location not found" });
        if (err.message === "LOCATION_NOT_OWNED")
            return res
                .status(403)
                .json({ message: "Location not owned by provider" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function providerSubmitCarController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const carId = getRequiredParam(req, res, "carId");
        if (!carId)
            return;
        const { note } = provider_cars_validation_1.providerSubmitSchema.parse(req.body);
        const car = await (0, provider_cars_service_1.providerSubmitCar)(providerId, carId, note);
        return res.json({ message: "Car submitted for approval", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "FORBIDDEN")
            return res.status(403).json({ message: "Not your car" });
        if (err.message === "INVALID_STATUS_FOR_SUBMIT")
            return res
                .status(400)
                .json({ message: "Only draft/rejected cars can be submitted" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function providerUploadCarImagesController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const carId = getRequiredParam(req, res, "carId");
        if (!carId)
            return;
        const files = req.files || [];
        await (0, provider_cars_service_1.providerUploadCarImages)(providerId, carId, files);
        return res.status(201).json({ message: "Images uploaded successfully" });
    }
    catch (err) {
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "FORBIDDEN")
            return res.status(403).json({ message: "Not your car" });
        if (err.message === "CAR_FLAGGED")
            return res
                .status(403)
                .json({ message: "Car is flagged. Contact support." });
        if (err.message === "NO_FILES")
            return res.status(400).json({ message: "No files uploaded" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function providerDeleteCarImageController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const carId = getRequiredParam(req, res, "carId");
        if (!carId)
            return;
        const imageId = getRequiredParam(req, res, "imageId");
        if (!imageId)
            return;
        const result = await (0, provider_cars_service_1.providerDeleteCarImage)(providerId, carId, imageId);
        return res.json(result);
    }
    catch (err) {
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "FORBIDDEN")
            return res.status(403).json({ message: "Not your car" });
        if (err.message === "IMAGE_NOT_FOUND")
            return res.status(404).json({ message: "Image not found" });
        if (err.message === "IMAGE_NOT_IN_CAR")
            return res
                .status(400)
                .json({ message: "Image does not belong to this car" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function providerAttachCarFeaturesController(req, res) {
    try {
        const providerId = getAuthenticatedProviderId(req, res);
        if (!providerId)
            return;
        const carId = getRequiredParam(req, res, "carId");
        if (!carId)
            return;
        const { featureIds } = provider_cars_validation_1.providerAttachFeaturesSchema.parse(req.body);
        const result = await (0, provider_cars_service_1.providerAttachCarFeatures)(providerId, carId, featureIds);
        return res.json(result);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "NOT_YOUR_CAR" || err.message === "FORBIDDEN")
            return res.status(403).json({ message: "Not your car" });
        if (err.message === "INVALID_FEATURE_OWNERSHIP")
            return res.status(403).json({ message: "Invalid feature ownership" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
