import { Request, Response } from "express";
import { ZodError } from "zod";
import { providerLoginSchema } from "./provider.auth.validation";
import { providerLogin, providerLogout } from "./provider.auth.service";

export async function loginProvider(req: Request, res: Response) {
  try {
    const data = providerLoginSchema.parse(req.body);

    const result = await providerLogin(data.email, data.password);

    return res.json({
      message: "Login successful",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    if (err.message === "PROVIDER_NOT_VERIFIED") {
      return res.status(403).json({
        message: "Provider account not verified yet",
      });
    }

    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutProvider(req: Request, res: Response) {
  try {
    const sessionId = req.user?.sessionId!;
    await providerLogout(sessionId);

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
