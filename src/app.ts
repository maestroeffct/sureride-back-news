import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import rentalRoutes from "./modules/rental/car.routes";
import pricingRoutes from "./modules/rental/pricing/pricing.routes";
import bookingRoutes from "./modules/rental/booking/booking.routes";
import kycRoutes from "./modules/kyc/kyc.routes";
import locationRoutes from "./modules/rental/location/location.routes";
import featureRoutes from "./modules/rental/feature/feature.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import { stripeWebhookController } from "./modules/payments/payment.controller";

const app = express();

app.post(
  "/payments/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookController,
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "SureRide API running" });
});

app.use("/auth", authRoutes);
app.use("/rental", rentalRoutes);
app.use("/pricing", pricingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/kyc", kycRoutes);
app.use("/rental/locations", locationRoutes);
app.use("/api", featureRoutes);
app.use("/payments", paymentRoutes);

export default app;
