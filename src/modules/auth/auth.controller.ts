import { Request, Response } from "express";
import { loginUser, registerUser } from "./auth.service";
import { registerSchema } from "./auth.validation";
import { ZodError } from "zod";
import { prisma } from "../../prisma";
import { signToken } from "../../utils/jwt";
import { resendOtp, verifyOtp } from "./otp.service";

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err: any) {
    // ✅ Zod validation error (CORRECT WAY)
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      console.log("ZOD ERROR:", formattedErrors);
      return res.status(400).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    if (err.message === "USER_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "Email or phone number already exists",
      });
    }

    // ✅ Prisma unique constraint
    if (err.code === "P2002") {
      // Fallback-safe handling
      const targets = err.meta?.target as string[] | undefined;

      if (targets?.includes("email")) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      if (
        targets?.includes("phoneCountry") ||
        targets?.includes("phoneNumber")
      ) {
        return res.status(409).json({
          message: "Phone number already exists",
        });
      }

      // fallback (when Prisma doesn't expose target)
      return res.status(409).json({
        message: "Account already exists with these details",
      });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// LOGIN CONTROLLER

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const result = await loginUser(email, password);

    // 🔒 Needs OTP
    if (result.status === "VERIFICATION_REQUIRED") {
      return res.status(403).json({
        status: "verification_required",
        message: "Please verify your account",
        phone: result.phone,
        userId: result.userId,
      });
    }

    // ✅ Success
    return res.json({
      status: "success",
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
}

// OTP VERIFICATION CONTROLLER
export async function verifyOtpHandler(req: Request, res: Response) {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "OTP required" });
    }

    await verifyOtp(userId, code);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const token = signToken({
      userId: user!.id,
      email: user!.email,
    });

    return res.json({
      message: "Account verified successfully",
      token,
      user: {
        id: user!.id,
        email: user!.email,
      },
    });
  } catch (err: any) {
    if (err.message === "INVALID_OR_EXPIRED_OTP") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (err.message === "ALREADY_VERIFIED") {
      return res.status(400).json({ message: "Account already verified" });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resendOtpHandler(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    await resendOtp(userId);

    return res.json({
      message: "Verification code sent",
    });
  } catch (err: any) {
    if (err.message?.startsWith("COOLDOWN_")) {
      const seconds = err.message.split("_")[1];
      return res.status(429).json({
        message: `Please wait ${seconds}s before requesting a new code`,
      });
    }

    if (err.message === "ALREADY_VERIFIED") {
      return res.status(400).json({ message: "Account already verified" });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
