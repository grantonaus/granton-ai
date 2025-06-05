import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";


import { client } from "./prisma";
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";


export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    await client.passwordResetToken.delete({
      where: { id: existingToken.id }
    });
  }

  const passwordResetToken = await client.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return passwordResetToken;
}

