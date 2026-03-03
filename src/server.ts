import "./env"; // MUST be first
import app from "./app";
import express from "express";
import path from "path";
import { startBookingCron } from "./jobs/booking.cron";

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
startBookingCron();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
