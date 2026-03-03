import cron from "node-cron";
import { prisma } from "../prisma";

export function startBookingCron() {
  // Runs every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Running booking completion job...");

    await prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        returnAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "COMPLETED",
      },
    });

    console.log("Booking auto-completion check done.");
  });
}
