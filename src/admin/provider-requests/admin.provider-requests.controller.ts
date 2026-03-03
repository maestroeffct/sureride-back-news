import { Request, Response } from "express";
import {
  listProviderRequests,
  approveProviderRequest,
  rejectProviderRequest,
} from "./admin.provider-requests.service";

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

export async function adminListProviderRequests(req: Request, res: Response) {
  const requests = await listProviderRequests({
    q: getQueryString(req.query.q),
    status: getQueryString(req.query.status),
    page: getQueryNumber(req.query.page),
    limit: getQueryNumber(req.query.limit),
  });
  return res.json(requests);
}

export async function adminApproveProviderRequest(req: Request, res: Response) {
  try {
    const id = getSingleParam(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const provider = await approveProviderRequest(id);

    return res.json({
      message: "Provider request approved",
      provider,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function adminRejectProviderRequest(req: Request, res: Response) {
  try {
    const id = getSingleParam(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const { adminNote } = req.body;

    const request = await rejectProviderRequest(id, adminNote);

    return res.json({
      message: "Provider request rejected",
      request,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
