import { Request, Response } from "express";
import {
  createOrUpdateDraftProvider,
  submitProvider,
  listProviders,
} from "./provider.onboarding.service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getQueryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function getQueryNumber(value: unknown): number | undefined {
  const parsed = Number(getQueryString(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function saveDraftProvider(req: Request, res: Response) {
  try {
    const provider = await createOrUpdateDraftProvider(req.body);
    return res.json(provider);
  } catch (err: any) {
    if (err.message === "NAME_AND_EMAIL_REQUIRED") {
      return res.status(400).json({ message: "Name and email are required" });
    }

    console.error(err);
    return res.status(500).json({ message: "Failed to save draft" });
  }
}

export async function finalizeProvider(req: Request, res: Response) {
  try {
    const providerId = getSingleParam(req.params.providerId);

    if (!providerId) {
      return res.status(400).json({ message: "providerId is required" });
    }

    const provider = await submitProvider(providerId);

    return res.json({
      message: "Provider submitted for admin approval",
      provider,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getProviders(req: Request, res: Response) {
  try {
    const providers = await listProviders({
      q: getQueryString(req.query.q),
      status: getQueryString(req.query.status),
      createdBy: getQueryString(req.query.createdBy),
      page: getQueryNumber(req.query.page),
      limit: getQueryNumber(req.query.limit),
    });

    return res.json(providers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch providers" });
  }
}
