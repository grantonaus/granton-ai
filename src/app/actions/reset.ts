"use server";

import * as z from "zod";

import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { client } from "@/lib/prisma";
import { PasswordResetSchema } from "@/components/form/password-reset";

export const reset = async (values: z.infer<typeof PasswordResetSchema>) => {
  const validatedFields = PasswordResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;

  console.log("email: ", email)

  // const existingUser = await getUserByEmail(email);

  const existingUser = await client.user.findUnique({ where: { email } });

  console.log("user: ", existingUser)

  if (!existingUser) {
    return { error: "Email not found!" };
  }

  const passwordResetToken = await generatePasswordResetToken(email);

  console.log("Generated token:", passwordResetToken);
  
  await sendPasswordResetEmail(
    // existingUser.firstName,
    existingUser.firstName ?? "there",
    passwordResetToken.email,
    passwordResetToken.token,
  );

  return { success: "Reset email sent!" };
}