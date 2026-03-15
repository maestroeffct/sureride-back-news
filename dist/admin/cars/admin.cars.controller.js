"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCarsController = adminListCarsController;
exports.adminGetCarController = adminGetCarController;
exports.adminCreateCarController = adminCreateCarController;
exports.adminUpdateCarController = adminUpdateCarController;
exports.adminApproveCarController = adminApproveCarController;
exports.adminRejectCarController = adminRejectCarController;
exports.adminFlagCarController = adminFlagCarController;
exports.adminUnflagCarController = adminUnflagCarController;
exports.adminActivateCarController = adminActivateCarController;
exports.adminDeactivateCarController = adminDeactivateCarController;
const zod_1 = require("zod");
const admin_cars_validation_1 = require("./admin.cars.validation");
const admin_cars_service_1 = require("./admin.cars.service");
function zodFail(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
function getRequiredCarId(req, res) {
    const rawCarId = req.params.carId;
    const carId = Array.isArray(rawCarId) ? rawCarId[0] : rawCarId;
    if (!carId) {
        res.status(400).json({ message: "carId is required" });
        return undefined;
    }
    return carId;
}
async function adminListCarsController(req, res) {
    try {
        const q = admin_cars_validation_1.adminCarListQuerySchema.parse(req.query);
        const data = await (0, admin_cars_service_1.adminListCars)(q);
        return res.json(data);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminGetCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const car = await (0, admin_cars_service_1.adminGetCar)(carId);
        return res.json(car);
    }
    catch (err) {
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminCreateCarController(req, res) {
    try {
        const body = admin_cars_validation_1.adminCreateCarSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminCreateCar)(body);
        return res.status(201).json({ message: "Car created", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "PROVIDER_NOT_FOUND")
            return res.status(404).json({ message: "Provider not found" });
        if (err.message === "LOCATION_NOT_FOUND")
            return res.status(404).json({ message: "Location not found" });
        if (err.message === "LOCATION_NOT_OWNED_BY_PROVIDER")
            return res
                .status(400)
                .json({ message: "Location does not belong to provider" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminUpdateCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const body = admin_cars_validation_1.adminUpdateCarSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminUpdateCar)(carId, body);
        return res.json({ message: "Car updated", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "LOCATION_NOT_FOUND")
            return res.status(404).json({ message: "Location not found" });
        if (err.message === "LOCATION_NOT_OWNED_BY_PROVIDER")
            return res
                .status(400)
                .json({ message: "Location does not belong to car provider" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminApproveCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const { note } = admin_cars_validation_1.adminApproveSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminApproveCar)(carId, note);
        return res.json({ message: "Car approved", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminRejectCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const { reason } = admin_cars_validation_1.adminRejectSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminRejectCar)(carId, reason);
        return res.json({ message: "Car rejected", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminFlagCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const { reason } = admin_cars_validation_1.adminFlagSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminFlagCar)(carId, reason);
        return res.json({ message: "Car flagged", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminUnflagCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const { note } = admin_cars_validation_1.adminUnflagSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminUnflagCar)(carId, note);
        return res.json({ message: "Car unflagged", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminActivateCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const car = await (0, admin_cars_service_1.adminActivateCar)(carId);
        return res.json({ message: "Car activated", car });
    }
    catch (err) {
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        if (err.message === "CAR_NOT_APPROVED")
            return res
                .status(400)
                .json({ message: "Car must be approved before activation" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function adminDeactivateCarController(req, res) {
    try {
        const carId = getRequiredCarId(req, res);
        if (!carId)
            return;
        const { reason } = admin_cars_validation_1.adminDeactivateSchema.parse(req.body);
        const car = await (0, admin_cars_service_1.adminDeactivateCar)(carId, reason);
        return res.json({ message: "Car deactivated", car });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        if (err.message === "CAR_NOT_FOUND")
            return res.status(404).json({ message: "Car not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
