import { Request, Response } from "express";
import { registerUser } from "./auth.service";

export async function register(req: Request, res: Response) {
  const {
    firstName,
    lastName,
    email,
    dateOfBirth,
    nationality,
    phoneCountry,
    phoneNumber,
    password,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !dateOfBirth ||
    !nationality ||
    !phoneCountry ||
    !phoneNumber ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await registerUser({
    firstName,
    lastName,
    email,
    dateOfBirth,
    nationality,
    phoneCountry,
    phoneNumber,
    password,
  });

  res.status(201).json({
    message: "Account created successfully",
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
