import { z } from "zod";

export const providerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
