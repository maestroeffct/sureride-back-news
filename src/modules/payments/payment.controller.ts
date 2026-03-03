import { Request, Response } from "express";
import {
  createStripePaymentSheetSession,
  getStripeConfig,
  handleStripeWebhook,
} from "./payment.service";

export async function getPaymentConfigController(_req: Request, res: Response) {
  try {
    const config = getStripeConfig();
    return res.json(config);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createPaymentSheetController(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookingId = req.body?.bookingId as string | undefined;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    const result = await createStripePaymentSheetSession({
      bookingId,
      userId,
    });

    return res.json(result);
  } catch (error: any) {
    if (error.message === "BOOKING_NOT_FOUND") {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      error.message === "BOOKING_NOT_PAYABLE" ||
      error.message === "BOOKING_ALREADY_PAID"
    ) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message || "Payment setup failed" });
  }
}

export async function stripeWebhookController(req: Request, res: Response) {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
      return res.status(400).json({ message: "Missing stripe-signature" });
    }

    const payload = req.body as Buffer;
    if (!Buffer.isBuffer(payload)) {
      return res.status(400).json({
        message: "Invalid webhook payload. Expected raw request body.",
      });
    }

    const result = await handleStripeWebhook(payload, signature);
    return res.json({ received: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Webhook failed" });
  }
}
