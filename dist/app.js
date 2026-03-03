"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const car_routes_1 = __importDefault(require("./modules/rental/car.routes"));
const pricing_routes_1 = __importDefault(require("./modules/rental/pricing/pricing.routes"));
const booking_routes_1 = __importDefault(require("./modules/rental/booking/booking.routes"));
const kyc_routes_1 = __importDefault(require("./modules/kyc/kyc.routes"));
const location_routes_1 = __importDefault(require("./modules/rental/location/location.routes"));
const feature_routes_1 = __importDefault(require("./modules/rental/feature/feature.routes"));
const payment_routes_1 = __importDefault(require("./modules/payments/payment.routes"));
const payment_controller_1 = require("./modules/payments/payment.controller");
const admin_auth_routes_1 = __importDefault(require("./admin/admin.auth.routes"));
const provider_auth_routes_1 = __importDefault(require("./modules/provider/provider.auth.routes"));
const provider_onboarding_routes_1 = __importDefault(require("./admin/provider/provider.onboarding.routes"));
const app = (0, express_1.default)();
const allowedOrigins = ["http://localhost:3000"];
const corsOptions = {
    origin(origin, callback) {
        // Allow server-to-server and tools like curl/Postman (no browser origin)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.post("/payments/webhook/stripe", express_1.default.raw({ type: "application/json" }), payment_controller_1.stripeWebhookController);
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ ok: true, message: "SureRide API running" });
});
app.use("/auth", auth_routes_1.default);
app.use("/rental", car_routes_1.default);
app.use("/pricing", pricing_routes_1.default);
app.use("/bookings", booking_routes_1.default);
app.use("/kyc", kyc_routes_1.default);
app.use("/rental/locations", location_routes_1.default);
app.use("/api", feature_routes_1.default);
app.use("/payments", payment_routes_1.default);
// ✅ admin
app.use("/admin/auth", admin_auth_routes_1.default);
// ✅ provider
app.use("/provider/auth", provider_auth_routes_1.default);
app.use("/admin", provider_onboarding_routes_1.default);
exports.default = app;
