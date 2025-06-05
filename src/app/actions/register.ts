"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";

import { client } from "@/lib/prisma";
import { SignUpSchema } from "@/components/form/sign-up";

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
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password successfully hashed", { email });

    // Split `name` into firstName + lastName
    const parts = name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    // Create user in Prisma (lastName is non‐nullable in your schema)
    await client.user.create({
      data: {
        firstName,
        lastName,
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
    return { success: "Account created successfully!" };

  } catch (error) {
    console.error("Error during user registration", { error });
    return { error: "An error occurred during registration." };
  }
};
