import { Request, Response } from "express";
import path from "path";
import { ZodError } from "zod";
import {
  createPaymentGatewaySchema,
  listPaymentTransactionsQuerySchema,
  paymentGatewayKeyParamSchema,
  replacePaymentGatewayFieldsSchema,
  replacePaymentGatewayValuesSchema,
  togglePaymentGatewaySchema,
  updatePaymentGatewaySchema,
  updatePaymentSettingsSchema,
} from "./admin.payments.validation";
import {
  createAdminPaymentGateway,
  getAdminPaymentSettings,
  listAdminPaymentGateways,
  listAdminPaymentTransactions,
  replaceAdminPaymentGatewayFields,
  replaceAdminPaymentGatewayValues,
  setAdminDefaultPaymentGateway,
  setAdminPaymentGatewayEnabled,
  softDeleteAdminPaymentGateway,
  updateAdminPaymentGateway,
  updateAdminPaymentGatewayLogo,
  updateAdminPaymentSettings,
} from "./admin.payments.service";

function validationError(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "VALIDATION_FAILED",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

function mapGatewayErrorStatus(errorCode: string) {
  if (errorCode === "GATEWAY_NOT_FOUND") return 404;
  if (errorCode === "GATEWAY_FIELD_NOT_FOUND") return 404;
  if (errorCode === "GATEWAY_KEY_ALREADY_EXISTS") return 409;
  if (errorCode === "GATEWAY_FIELD_KEY_CONFLICT") return 409;
  if (errorCode === "GATEWAY_DEFAULT_DISABLE_FORBIDDEN") return 409;
  if (errorCode === "GATEWAY_DEFAULT_DELETE_FORBIDDEN") return 409;
  if (errorCode === "GATEWAY_NOT_ENABLED") return 400;
  if (errorCode === "GATEWAY_RUNTIME_NOT_IMPLEMENTED") return 400;
  if (errorCode === "GATEWAY_REQUIRED_VALUES_MISSING") return 400;
  return 500;
}

function gatewayError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) return validationError(res, error);

  const message =
    error instanceof Error && error.message ? error.message : fallbackMessage;
  const status = mapGatewayErrorStatus(message);

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json({ message });
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

export async function adminListPaymentGatewaysController(
  _req: Request,
  res: Response,
) {
  try {
    const gateways = await listAdminPaymentGateways();
    return res.json({ items: gateways });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
  }
}

export async function adminCreatePaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const body = createPaymentGatewaySchema.parse(req.body);
    const gateway = await createAdminPaymentGateway({
      ...body,
      updatedByAdminId: req.user?.adminId,
    });
    return res.status(201).json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminUpdatePaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    const body = updatePaymentGatewaySchema.parse(req.body);
    const gateway = await updateAdminPaymentGateway(key, body);
    return res.json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminReplacePaymentGatewayFieldsController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    const body = replacePaymentGatewayFieldsSchema.parse(req.body);
    const gateway = await replaceAdminPaymentGatewayFields(key, body);
    return res.json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminReplacePaymentGatewayValuesController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    const body = replacePaymentGatewayValuesSchema.parse(req.body);
    const gateway = await replaceAdminPaymentGatewayValues(key, {
      ...body,
      updatedByAdminId: req.user?.adminId,
    });
    return res.json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminSetPaymentGatewayEnabledController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    const body = togglePaymentGatewaySchema.parse(req.body);
    const gateway = await setAdminPaymentGatewayEnabled(key, body.isEnabled);
    return res.json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminSetDefaultPaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    const gateway = await setAdminDefaultPaymentGateway(key);
    return res.json(gateway);
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminDeletePaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);
    await softDeleteAdminPaymentGateway(key);
    return res.json({ message: "Gateway archived" });
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminUploadPaymentGatewayLogoController(
  req: Request,
  res: Response,
) {
  try {
    const { key } = paymentGatewayKeyParamSchema.parse(req.params);

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "VALIDATION_FAILED" });
    }

    const extension = path.extname(file.originalname || "").toLowerCase();
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
    if (extension && !allowed.has(extension)) {
      return res.status(400).json({ message: "VALIDATION_FAILED" });
    }

    const logoUrl = `${getPublicBaseUrl(req)}/uploads/${file.filename}`;
    const gateway = await updateAdminPaymentGatewayLogo(key, logoUrl);
    return res.json({ logoUrl: gateway.logoUrl });
  } catch (error) {
    return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
  }
}

export async function adminGetPaymentSettingsController(
  _req: Request,
  res: Response,
) {
  try {
    const settings = await getAdminPaymentSettings();
    return res.json(settings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
  }
}

export async function adminUpdatePaymentSettingsController(
  req: Request,
  res: Response,
) {
  try {
    const body = updatePaymentSettingsSchema.parse(req.body);
    const settings = await updateAdminPaymentSettings(body);
    return res.json({
      message: "Payment settings updated",
      settings,
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(res, error);
    console.error(error);
    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
  }
}

export async function adminListPaymentTransactionsController(
  req: Request,
  res: Response,
) {
  try {
    const query = listPaymentTransactionsQuerySchema.parse(req.query);
    const result = await listAdminPaymentTransactions(query);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) return validationError(res, error);
    console.error(error);
    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
  }
}
