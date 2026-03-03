import { Request, Response } from "express";
import {
  upsertProviderPayoutAccount,
  createPayout,
  markPayoutPaid,
} from "./admin.payout.service";

export async function adminUpsertPayoutAccount(req: Request, res: Response) {
  try {
    const { providerId } = req.params;
    const account = await upsertProviderPayoutAccount(providerId, req.body);
    return res.json({ message: "Payout account saved", account });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminCreatePayout(req: Request, res: Response) {
  try {
    const { providerId } = req.params;
    const { amount, note } = req.body;
    const payout = await createPayout(providerId, Number(amount), note);
    return res.json({ message: "Payout created", payout });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminMarkPayoutPaid(req: Request, res: Response) {
  try {
    const { payoutId } = req.params;
    const { reference } = req.body;
    const payout = await markPayoutPaid(payoutId, reference);
    return res.json({ message: "Payout marked as paid", payout });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
