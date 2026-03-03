import { Request, Response } from "express";
import {
  approveProvider,
  suspendProvider,
  setProviderCommission,
} from "./admin.providers.service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function adminApproveProvider(req: Request, res: Response) {
  try {
    const providerId = getSingleParam(req.params.providerId);
    if (!providerId) {
      return res.status(400).json({ message: "providerId is required" });
    }

    const provider = await approveProvider(providerId);
    return res.json({ message: "Provider approved", provider });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminSuspendProvider(req: Request, res: Response) {
  try {
    const providerId = getSingleParam(req.params.providerId);
    if (!providerId) {
      return res.status(400).json({ message: "providerId is required" });
    }

    const { reason } = req.body;
    const provider = await suspendProvider(providerId, reason);
    return res.json({ message: "Provider suspended", provider });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminSetCommission(req: Request, res: Response) {
  try {
    const providerId = getSingleParam(req.params.providerId);
    if (!providerId) {
      return res.status(400).json({ message: "providerId is required" });
    }

    const { commissionRate } = req.body;
    const provider = await setProviderCommission(
      providerId,
      Number(commissionRate),
    );
    return res.json({ message: "Commission updated", provider });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
