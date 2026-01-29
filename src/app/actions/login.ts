"use server";

import * as z from "zod";
import { client } from "@/lib/prisma";
import { SignInSchema } from "@/components/form/login";
import { verifyPassword, createSession } from "@/lib/auth-custom";

export const login = async (
  values: z.infer<typeof SignInSchema>,
  callbackUrl?: string | null,
) => {
  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error);
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    const user = await client.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return { error: "Invalid credentials!" };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: "Invalid credentials!" };
    }

    await createSession(user.id);

    return {
      success: true,
      callbackUrl: callbackUrl || "/new-application",
    };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
