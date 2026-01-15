import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  phoneCountry: string;
  phoneNumber: string;
  password: string;
};

export async function registerUser(data: RegisterPayload) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      dateOfBirth: new Date(data.dateOfBirth),
      nationality: data.nationality,
      phoneCountry: data.phoneCountry,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      authProvider: "EMAIL",
    },
  });
}
