import { Request, Response } from "express";
import {
  approveProviderDocument,
  rejectProviderDocument,
  listProviderDocuments,
} from "./admin.providerDocs.service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function adminListProviderDocs(req: Request, res: Response) {
  const providerId = getSingleParam(req.params.providerId);
  if (!providerId) {
    return res.status(400).json({ message: "providerId is required" });
  }

  const docs = await listProviderDocuments(providerId);
  return res.json(docs);
}

export async function adminApproveDoc(req: Request, res: Response) {
  try {
    const docId = getSingleParam(req.params.docId);
    if (!docId) {
      return res.status(400).json({ message: "docId is required" });
    }

    const doc = await approveProviderDocument(docId);
    return res.json({ message: "Document approved", doc });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function adminRejectDoc(req: Request, res: Response) {
  try {
    const docId = getSingleParam(req.params.docId);
    if (!docId) {
      return res.status(400).json({ message: "docId is required" });
    }

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Reason required" });

    const doc = await rejectProviderDocument(docId, reason);
    return res.json({ message: "Document rejected", doc });
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
