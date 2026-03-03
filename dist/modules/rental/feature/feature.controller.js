"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalFeatureController = createGlobalFeatureController;
exports.createProviderFeatureController = createProviderFeatureController;
exports.listProviderFeaturesController = listProviderFeaturesController;
exports.attachFeaturesController = attachFeaturesController;
exports.getCarWithFeaturesController = getCarWithFeaturesController;
const feature_service_1 = require("./feature.service");
function getString(value) {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }
    return undefined;
}
/**
 * ADMIN - Create Global Feature
 */
async function createGlobalFeatureController(req, res) {
    try {
        const { name, category, icon } = req.body;
        const feature = await (0, feature_service_1.createGlobalFeature)({
            name,
            category: category,
            icon,
        });
        return res.status(201).json(feature);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create feature" });
    }
}
/**
 * PROVIDER - Create Feature
 */
async function createProviderFeatureController(req, res) {
    try {
        const providerId = req.user?.providerId;
        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { name, category, icon } = req.body;
        const feature = await (0, feature_service_1.createProviderFeature)(providerId, {
            name,
            category: category,
            icon,
        });
        return res.status(201).json(feature);
    }
    catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ message: "Failed to create provider feature" });
    }
}
/**
 * PROVIDER - List features
 */
async function listProviderFeaturesController(req, res) {
    try {
        const providerId = req.user?.providerId;
        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const features = await (0, feature_service_1.listProviderFeatures)(providerId);
        return res.json(features);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch features" });
    }
}
/**
 * PROVIDER - Attach Features to Car
 */
async function attachFeaturesController(req, res) {
    try {
        const providerId = req.user?.providerId;
        if (!providerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const carId = getString(req.params.carId);
        if (!carId) {
            return res.status(400).json({ message: "Missing carId" });
        }
        const { featureIds } = req.body;
        const result = await (0, feature_service_1.attachFeaturesToCar)(providerId, carId, featureIds);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        if (err.message === "NOT_YOUR_CAR") {
            return res.status(403).json({ message: "Unauthorized car access" });
        }
        if (err.message === "INVALID_FEATURE_OWNERSHIP") {
            return res.status(403).json({ message: "Invalid feature ownership" });
        }
        return res.status(500).json({ message: "Failed to attach features" });
    }
}
/**
 * PUBLIC - Get car with features
 */
async function getCarWithFeaturesController(req, res) {
    try {
        const carId = getString(req.params.carId);
        if (!carId) {
            return res.status(400).json({ message: "Missing carId" });
        }
        const car = await (0, feature_service_1.getCarWithFeatures)(carId);
        return res.json(car);
    }
    catch (err) {
        console.error(err);
        return res.status(404).json({ message: "Car not found" });
    }
}
