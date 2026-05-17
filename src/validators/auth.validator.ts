import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255, "Email terlalu panjang").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi").max(128, "Password terlalu panjang"),
});

export type LoginInput = z.infer<typeof loginSchema>;
