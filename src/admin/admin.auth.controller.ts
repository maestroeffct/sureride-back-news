import { Request, Response } from "express";
import { ZodError } from "zod";
import { adminLoginSchema } from "./admin.auth.validation";
import { adminLogin, adminLogout } from "./admin.auth.service";

export async function loginAdmin(req: Request, res: Response) {
  try {
    const data = adminLoginSchema.parse(req.body);

    const result = await adminLogin(data.email, data.password);

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

    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutAdmin(req: Request, res: Response) {
  try {
    const sessionId = req.user?.sessionId!;
    await adminLogout(sessionId);

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
