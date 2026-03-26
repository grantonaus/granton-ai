import { cookies } from "next/headers";
import { client } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT, verifyJWT as verifyJWTToken } from "./jwt";
import { SESSION_COOKIE_NAME } from "./auth-constants";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function verifyJWT(
  token: string
): Promise<Record<string, unknown> | null> {
  return verifyJWTToken(token);
}

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  image?: string | null;
  profileComplete?: boolean;
  companyComplete?: boolean;
  isOAuth?: boolean;
}

export async function createSession(userId: string): Promise<string> {
  const user = await client.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const sessionData: SessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    image: user.image,
    profileComplete: user.profileComplete || false,
    companyComplete: user.companyComplete || false,
    isOAuth: user.accounts.length > 0,
  };

  const token = await signJWT(
    sessionData as unknown as Record<string, unknown>,
    SESSION_MAX_AGE
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyJWTToken(token);
    if (!payload) return null;
    return payload as unknown as SessionUser;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
