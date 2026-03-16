import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createPaymentGatewaySchema,
  listPaymentTransactionsQuerySchema,
  paymentGatewayProviderParamSchema,
  togglePaymentGatewaySchema,
  updatePaymentGatewaySchema,
  updatePaymentSettingsSchema,
} from "./admin.payments.validation";
import {
  createAdminPaymentGateway,
  getAdminPaymentSettings,
  listAdminPaymentGateways,
  listAdminPaymentTransactions,
  setAdminDefaultPaymentGateway,
  setAdminPaymentGatewayEnabled,
  updateAdminPaymentGateway,
  updateAdminPaymentSettings,
} from "./admin.payments.service";

function validationError(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
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
    return res.status(500).json({ message: "Failed to list payment gateways" });
  }
}

export async function adminCreatePaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const body = createPaymentGatewaySchema.parse(req.body);
    const gateway = await createAdminPaymentGateway(body);

    return res.status(201).json({
      message: "Payment gateway created",
      gateway,
    });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "PAYMENT_GATEWAY_ALREADY_EXISTS") {
      return res.status(409).json({ message: "Gateway already exists" });
    }
    if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
      return res
        .status(400)
        .json({ message: "Provider exists but runtime integration is not yet implemented" });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to create payment gateway" });
  }
}

export async function adminUpdatePaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const { provider } = paymentGatewayProviderParamSchema.parse(req.params);
    const body = updatePaymentGatewaySchema.parse(req.body);
    const gateway = await updateAdminPaymentGateway(provider, body);

    return res.json({
      message: "Payment gateway updated",
      gateway,
    });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
      return res.status(404).json({ message: "Gateway not found" });
    }
    if (error.message === "DEFAULT_GATEWAY_DISABLE_FORBIDDEN") {
      return res.status(400).json({ message: "Default gateway cannot be disabled" });
    }
    if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
      return res
        .status(400)
        .json({ message: "Provider exists but runtime integration is not yet implemented" });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to update payment gateway" });
  }
}

export async function adminSetPaymentGatewayEnabledController(
  req: Request,
  res: Response,
) {
  try {
    const { provider } = paymentGatewayProviderParamSchema.parse(req.params);
    const body = togglePaymentGatewaySchema.parse(req.body);
    const gateway = await setAdminPaymentGatewayEnabled(provider, body.isEnabled);

    return res.json({
      message: "Payment gateway status updated",
      gateway,
    });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
      return res.status(404).json({ message: "Gateway not found" });
    }
    if (error.message === "DEFAULT_GATEWAY_DISABLE_FORBIDDEN") {
      return res.status(400).json({ message: "Default gateway cannot be disabled" });
    }

    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update payment gateway status" });
  }
}

export async function adminSetDefaultPaymentGatewayController(
  req: Request,
  res: Response,
) {
  try {
    const { provider } = paymentGatewayProviderParamSchema.parse(req.params);
    const gateway = await setAdminDefaultPaymentGateway(provider);

    return res.json({
      message: "Default payment gateway updated",
      gateway,
    });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
      return res.status(404).json({ message: "Gateway not found" });
    }
    if (error.message === "PAYMENT_GATEWAY_NOT_ENABLED") {
      return res.status(400).json({ message: "Gateway must be enabled first" });
    }
    if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
      return res
        .status(400)
        .json({ message: "Provider exists but runtime integration is not yet implemented" });
    }

    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update default payment gateway" });
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
    return res.status(500).json({ message: "Failed to fetch payment settings" });
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
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);

    console.error(error);
    return res.status(500).json({ message: "Failed to update payment settings" });
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
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);

    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch payment transactions" });
  }
}
