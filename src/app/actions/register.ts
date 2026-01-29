"use server";

import * as z from "zod";
import { client } from "@/lib/prisma";
import { SignUpSchema } from "@/components/form/sign-up";
import { hashPassword, createSession } from "@/lib/auth-custom";
import { getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof SignUpSchema>) => {
  try {
    // Validate input
    const validatedFields = SignUpSchema.safeParse(values);

    if (!validatedFields.success) {
      console.error("Invalid fields!", { values, error: validatedFields.error });
      return { error: "Invalid fields!" };
    }

    const { name, email, password } = validatedFields.data;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.warn("Email already in use", { email });
      return { error: "Email already in use!" };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    console.log("Password successfully hashed", { email });

    // Split `name` into firstName + lastName
    const parts = name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    // Create user in database
    const user = await client.user.create({
      data: {
        firstName,
        lastName,
        name: name.trim(),
        email,
        password: hashedPassword,
        contactSalutation: "",            
        contactJobTitle: "",              
        contactFirstName: firstName,      
        contactLastName: lastName,        
        contactEmail: email,              
        contactMobile: "",                
      },
    });

    // Create session
    await createSession(user.id);

    return { success: "Account created successfully!" };

  } catch (error) {
    console.error("Error during user registration", { error });
    return { error: "An error occurred during registration." };
  }
};
