import { Request, Response } from "express";
import { createProviderRequest } from "./provider-request.service";

export async function submitProviderRequest(req: Request, res: Response) {
  try {
    const { businessName, email, phone } = req.body;

    if (!businessName || !email) {
      return res.status(400).json({
        message: "Business name and email are required",
      });
    }

    const request = await createProviderRequest({
      businessName,
      email,
      phone,
    });

    return res.status(201).json({
      message: "Request submitted successfully. We will contact you.",
      request,
    });
  } catch (err: any) {
    if (err.message === "REQUEST_ALREADY_EXISTS") {
      return res.status(400).json({
        message: "A pending request already exists for this email",
      });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
