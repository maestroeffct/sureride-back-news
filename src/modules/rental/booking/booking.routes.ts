import { Router } from "express";
import {
  cancelBooking,
  confirmBooking,
  createBookingController,
  getBookingDetails,
  getUserBookings,
} from "./booking.controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, createBookingController);

router.get("/", requireAuth, getUserBookings);
router.get("/:bookingId", requireAuth, getBookingDetails);
router.patch("/:bookingId/cancel", requireAuth, cancelBooking);
router.patch("/:bookingId/confirm", requireAuth, confirmBooking);

export default router;
