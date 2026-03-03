import { Request, Response } from "express";
import {
  listProviderRequests,
  approveProviderRequest,
  rejectProviderRequest,
} from "./admin.provider-requests.service";

export async function adminListProviderRequests(req: Request, res: Response) {
  const requests = await listProviderRequests();
  return res.json(requests);
}

export async function adminApproveProviderRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
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
    const { id } = req.params;
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
