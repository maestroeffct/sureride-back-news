import { Request, Response } from "express";
import { ZodError } from "zod";

import { updateProfileSchema, updatePasswordSchema } from "./users.validation";

import {
  getCurrentUser,
  updateCurrentUser,
  updateUserPassword,
  deactivateUser,
} from "./users.service";

function validationError(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues,
  });
}

function getAuthenticatedUserId(
  req: Request,
  res: Response,
): string | undefined {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  return userId;
}

export async function getMeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const user = await getCurrentUser(userId);

    return res.json(user);
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const body = updateProfileSchema.parse(req.body);

    const user = await updateCurrentUser(userId, body);

    return res.json(user);
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "DUPLICATE")
      return res.status(409).json({ message: "Phone or email already exists" });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updatePasswordController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const body = updatePasswordSchema.parse(req.body);

    const result = await updateUserPassword(
      userId,
      body.oldPassword,
      body.newPassword,
    );

    return res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "INVALID_OLD_PASSWORD")
      return res.status(400).json({ message: "Old password is incorrect" });

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMeController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const user = await deactivateUser(userId);

    return res.json({
      message: "Account deactivated",
      user,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}
