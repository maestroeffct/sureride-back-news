import express from "express";
import cors, { CorsOptions } from "cors";
import authRoutes from "./modules/auth/auth.routes";
import rentalRoutes from "./modules/rental/car.routes";
import pricingRoutes from "./modules/rental/pricing/pricing.routes";
import bookingRoutes from "./modules/rental/booking/booking.routes";
import kycRoutes from "./modules/kyc/kyc.routes";
import locationRoutes from "./modules/rental/location/location.routes";
import featureRoutes from "./modules/rental/feature/feature.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import { stripeWebhookController } from "./modules/payments/payment.controller";
import adminAuthRoutes from "./admin/admin.auth.routes";
import providerAuthRoutes from "./modules/provider/provider.auth.routes";
import providerOnboardingRoutes from "./admin/provider/provider.onboarding.routes";
import adminProvidersRoutes from "./admin/provider/admin.providers.routes";
import adminProviderDocsRoutes from "./admin/provider/admin.providerDocs.routes";
import adminPayoutRoutes from "./admin/payout/admin.payout.routes";
import providerRequestRoutes from "./modules/provider-request/provider-request.routes";
import adminProviderRequestRoutes from "./admin/provider-requests/admin.provider-requests.routes";

const app = express();

const allowedOrigins = ["http://localhost:3000"];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow server-to-server and tools like curl/Postman (no browser origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

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
app.use("/", providerRequestRoutes);
// ✅ admin
app.use("/admin/auth", adminAuthRoutes);

// ✅ provider
app.use("/provider/auth", providerAuthRoutes);

app.use("/admin", providerOnboardingRoutes);

app.use("/admin", adminProvidersRoutes);
app.use("/admin", adminProviderDocsRoutes);
app.use("/admin", adminPayoutRoutes);
app.use("/admin", adminProviderRequestRoutes);

export default app;
