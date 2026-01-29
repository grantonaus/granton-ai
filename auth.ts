import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { client } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserById } from "@/data/user";
import { getAccountByUserId } from "@/data/account";

export const auth = betterAuth({
  database: prismaAdapter(client, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async hashPassword(password: string) {
      return await bcrypt.hash(password, 10);
    },
    async verifyPassword(password: string, hash: string) {
      return await bcrypt.compare(password, hash);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  callbacks: {
    async user({ user, account }: { user: { id: string; name: string | null }; account: { provider: string } | null }) {
      // Handle Google OAuth user name splitting
      if (account?.provider === "google" && user.name && user.id) {
        const [firstName, ...rest] = user.name.trim().split(" ");
        const lastName = rest.join(" ");

        try {
          await client.user.update({
            where: { id: user.id },
            data: { firstName, lastName },
          });
        } catch (err) {
          console.warn("Failed to update user", err);
        }
      }
      return user;
    },
    async session({ session, user }: { session: { user: Record<string, unknown> }; user: { id: string } | null }) {
      if (user) {
        const existingUser = await getUserById(user.id);
        if (existingUser) {
          const existingAccount = await getAccountByUserId(existingUser.id);
          
          session.user = {
            ...session.user,
            id: existingUser.id,
            firstName: existingUser.firstName || undefined,
            lastName: existingUser.lastName || undefined,
            email: existingUser.email,
            isOAuth: !!existingAccount,
            profileComplete: existingUser.profileComplete || false,
            companyComplete: existingUser.companyComplete || false,
          };
        }
      }
      return session;
    },
  },
  basePath: "/api/auth",
  baseURL: process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.NEXTAUTH_SECRET || process.env.BETTER_AUTH_SECRET!,
});

export type Session = typeof auth.$Infer.Session;
