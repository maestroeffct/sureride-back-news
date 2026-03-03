import { Request, Response } from "express";
import {
  approveProviderDocument,
  rejectProviderDocument,
  listProviderDocuments,
} from "./admin.providerDocs.service";

export async function adminListProviderDocs(req: Request, res: Response) {
  const { providerId } = req.params;
  const docs = await listProviderDocuments(providerId);
  return res.json(docs);
}

export async function adminApproveDoc(req: Request, res: Response) {
  try {
    const { docId } = req.params;
    const doc = await approveProviderDocument(docId);
    return res.json({ message: "Document approved", doc });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminRejectDoc(req: Request, res: Response) {
  try {
    const { docId } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: "Reason required" });

    const doc = await rejectProviderDocument(docId, reason);
    return res.json({ message: "Document rejected", doc });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
