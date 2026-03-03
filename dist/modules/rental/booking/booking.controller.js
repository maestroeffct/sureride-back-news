"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingController = createBookingController;
exports.getUserBookings = getUserBookings;
exports.getBookingDetails = getBookingDetails;
exports.cancelBooking = cancelBooking;
exports.confirmBooking = confirmBooking;
const booking_service_1 = require("./booking.service");
function getString(value) {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }
    return undefined;
}
async function createBookingController(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const booking = await (0, booking_service_1.createBooking)({
            userId,
            carId: req.body.carId,
            pickupAt: new Date(req.body.pickupAt),
            returnAt: new Date(req.body.returnAt),
            pickupLocationId: req.body.pickupLocationId,
            dropoffLocationId: req.body.dropoffLocationId,
            insuranceId: req.body.insuranceId,
        });
        return res.json({
            message: "Booking created successfully",
            booking,
        });
    }
    catch (err) {
        if (err.message === "PROFILE_INCOMPLETE") {
            return res.status(403).json({
                message: "Complete your profile before booking",
            });
        }
        return res.status(400).json({ message: err.message });
    }
}
async function getUserBookings(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const status = getString(req.query.status);
        const bookings = await (0, booking_service_1.fetchUserBookings)(userId, status);
        return res.json(bookings);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch bookings" });
    }
}
async function getBookingDetails(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const bookingId = getString(req.params.bookingId);
        if (!bookingId) {
            return res.status(400).json({ message: "Missing bookingId" });
        }
        const booking = await (0, booking_service_1.fetchBookingDetails)(userId, bookingId);
        return res.json(booking);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch booking details" });
    }
}
async function cancelBooking(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const bookingId = getString(req.params.bookingId);
        if (!bookingId) {
            return res.status(400).json({ message: "Missing bookingId" });
        }
        const booking = await (0, booking_service_1.cancelUserBooking)(userId, bookingId);
        return res.json({
            message: "Booking cancelled successfully",
            booking,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
async function confirmBooking(req, res) {
    try {
        const bookingId = getString(req.params.bookingId);
        if (!bookingId) {
            return res.status(400).json({ message: "Missing bookingId" });
        }
        const booking = await (0, booking_service_1.confirmUserBooking)(bookingId);
        return res.json({
            message: "Booking confirmed",
            booking,
        });
    }
    catch (error) {
        if (error.message === "PAYMENT_NOT_COMPLETED") {
            return res.status(400).json({ message: "Payment not completed" });
        }
        return res.status(400).json({ message: error.message });
    }
}
