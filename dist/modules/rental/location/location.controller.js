"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLocationController = searchLocationController;
exports.listLocations = listLocations;
const location_service_1 = require("./location.service");
async function searchLocationController(req, res) {
    try {
        const { q, countryId } = req.query;
        const locations = await (0, location_service_1.searchLocations)({
            query: String(q),
            countryId: countryId ? String(countryId) : undefined,
        });
        return res.json(locations);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to search locations" });
    }
}
async function listLocations(_req, res) {
    try {
        const locations = await (0, location_service_1.listAllLocations)();
        return res.json(locations);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch locations" });
    }
}
