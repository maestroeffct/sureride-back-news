import { Request, Response } from "express";
import { ZodError } from "zod";

import {
  adminCreateUserSchema,
  adminUsersQuerySchema,
  adminUserStatusSchema,
  adminVerificationSchema,
  adminProfileStatusSchema,
  adminRejectKycSchema,
} from "./admin.users.validation";

import {
  adminCreateUser,
  adminListUsers,
  adminGetUser,
  adminUpdateUserStatus,
  adminUpdateVerification,
  adminUpdateProfileStatus,
  adminApproveUserKyc,
  adminRejectUserKyc,
} from "./admin.users.service";

function validationError(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

function normalizeParam(param: string | string[] | undefined) {
  if (!param) return undefined;
  return Array.isArray(param) ? param[0] : param;
}

function getPublicBaseUrl(req: Request) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]
      : req.protocol;
  const host = req.get("host");

  return host ? `${protocol}://${host}` : "";
}

/**
 * POST /admin/users
 */
export async function adminCreateUserController(req: Request, res: Response) {
  try {
    const body = adminCreateUserSchema.parse(req.body);

    const result = await adminCreateUser(body);

    return res.status(201).json({
      message: "User created",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "USER_ALREADY_EXISTS")
      return res
        .status(409)
        .json({ message: "Email or phone number already exists" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /admin/users
 */
export async function adminListUsersController(req: Request, res: Response) {
  try {
    const query = adminUsersQuerySchema.parse(req.query);

    const users = await adminListUsers(query, getPublicBaseUrl(req));

    return res.json(users);
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /admin/users/:userId
 */
export async function adminGetUserController(req: Request, res: Response) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await adminGetUser(userId, getPublicBaseUrl(req));

    return res.json(user);
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PATCH /admin/users/:userId/status
 */
export async function adminUserStatusController(req: Request, res: Response) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const body = adminUserStatusSchema.parse(req.body);

    const user = await adminUpdateUserStatus(userId, body.isActive);

    return res.json({
      message: "User status updated",
      user,
    });
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PATCH /admin/users/:userId/verification
 */
export async function adminVerificationController(req: Request, res: Response) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const body = adminVerificationSchema.parse(req.body);

    const user = await adminUpdateVerification(
      userId,
      body.isVerified,
      body.profileStatus,
    );

    return res.json({
      message: "User verification updated",
      user,
    });
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PATCH /admin/users/:userId/profile-status
 */
export async function adminProfileStatusController(
  req: Request,
  res: Response,
) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const body = adminProfileStatusSchema.parse(req.body);

    const user = await adminUpdateProfileStatus(userId, body.profileStatus);

    return res.json({
      message: "Profile status updated",
      user,
    });
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PATCH /admin/users/:userId/kyc/approve
 */
export async function adminApproveKycController(req: Request, res: Response) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await adminApproveUserKyc(userId, getPublicBaseUrl(req));

    return res.json({
      message: "KYC approved",
      user,
    });
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });
    if (err.message === "KYC_NOT_FOUND")
      return res.status(404).json({ message: "KYC record not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PATCH /admin/users/:userId/kyc/reject
 */
export async function adminRejectKycController(req: Request, res: Response) {
  try {
    const userId = normalizeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const body = adminRejectKycSchema.parse(req.body);

    const user = await adminRejectUserKyc(
      userId,
      body.reason,
      getPublicBaseUrl(req),
    );

    return res.json({
      message: "KYC rejected",
      user,
    });
  } catch (err: any) {
    if (err instanceof ZodError) return validationError(res, err);

    if (err.message === "USER_NOT_FOUND")
      return res.status(404).json({ message: "User not found" });
    if (err.message === "KYC_NOT_FOUND")
      return res.status(404).json({ message: "KYC record not found" });

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
