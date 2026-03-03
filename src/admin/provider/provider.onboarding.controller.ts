import { Request, Response } from "express";
import {
  createOrUpdateDraftProvider,
  submitProvider,
  listProviders,
} from "./provider.onboarding.service";

export async function saveDraftProvider(req: Request, res: Response) {
  try {
    const provider = await createOrUpdateDraftProvider(req.body);
    return res.json(provider);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to save draft" });
  }
}

export async function finalizeProvider(req: Request, res: Response) {
  try {
    const rawProviderId = req.params.providerId;
    const providerId = Array.isArray(rawProviderId)
      ? rawProviderId[0]
      : rawProviderId;

    if (!providerId) {
      return res.status(400).json({ message: "providerId is required" });
    }

    const provider = await submitProvider(providerId);

    return res.json({
      message: "Provider activated successfully",
      provider,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getProviders(req: Request, res: Response) {
  const providers = await listProviders();
  return res.json(providers);
}
