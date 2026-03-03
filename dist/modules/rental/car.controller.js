"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCars = searchCars;
exports.listCars = listCars;
const car_service_1 = require("./car.service");
async function searchCars(req, res) {
    const { pickupLocationId, dropoffLocationId, pickupAt, returnAt, countryCode, } = req.query;
    if (!pickupLocationId || !pickupAt || !returnAt || !countryCode) {
        return res.status(400).json({
            message: "Missing required search parameters",
        });
    }
    const cars = await (0, car_service_1.searchAvailableCars)({
        pickupLocationId: pickupLocationId,
        dropoffLocationId: dropoffLocationId,
        pickupAt: new Date(pickupAt),
        returnAt: new Date(returnAt),
        countryCode: countryCode,
    });
    res.json({
        search: {
            pickupAt,
            returnAt,
            countryCode,
        },
        total: cars.length,
        cars,
    });
}
async function listCars(_req, res) {
    try {
        const cars = await (0, car_service_1.listAllCars)();
        return res.json(cars);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch cars" });
    }
}
