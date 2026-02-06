import { z } from "zod"

export const SignInSchema = z.object({
  email: z.string().email("You must give a valid email"),
  password: z
    .string()
    .min(8, { message: "Your password must be at least 8 characters long" })
    .max(64, {
      message: "Your password can not be longer than 64 characters",
    }),
})