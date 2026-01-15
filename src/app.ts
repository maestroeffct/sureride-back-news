import express from "express";
import authRoutes from "./modules/auth/auth.routes";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "SureRide API running" });
});

app.use("/auth", authRoutes);

export default app;
