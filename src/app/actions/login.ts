"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { signIn } from "../../../auth";
import { client } from "@/lib/prisma";
import { SignInSchema } from "@/components/form/login";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

export const login = async (
  values: z.infer<typeof SignInSchema>,
  callbackUrl?: string | null,
) => {
  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error); // Log validation errors
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;
  // const existingUser = await getUserByEmail(email);
  const existingUser = await client.user.findUnique({ where: { email } });

  console.log("Fetched user:", existingUser);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    console.error("Invalid credentials:", email); // Log if user is not found
    return { error: "Invalid credentials!" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      // redirectTo: callbackUrl || "/new-application",
    });

    console.log("SignIn Result:", result); // Log the result from signIn
    return result;

  } catch (error) {
    if (isRedirectError(error)) {
      return;
    }


    if (error instanceof AuthError) {
      console.error("AuthError:", error); // Log AuthError with specific error type
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }
        default:
          return { error: "Something went wrong!" }
      }
    }

    console.error("Unexpected Error:", error); // Log unexpected errors
    throw error;

  }
};
