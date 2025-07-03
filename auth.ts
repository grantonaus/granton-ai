import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";

import { client } from "@/lib/prisma";
import authConfig from "./auth.config";
import { getUserById } from "@/data/user";
import { getAccountByUserId } from "@/data/account";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id as string);


      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user) {
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email || '';
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.profileComplete = token.profileComplete as boolean;
        session.user.companyComplete = token.companyComplete as boolean;
        session.user.hasPaid = token.hasPaid as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(
        existingUser.id
      );

      token.isOAuth = !!existingAccount;
      token.firstName = existingUser.firstName;
      token.lastName = existingUser.lastName;
      token.email = existingUser.email;
      token.profileComplete = existingUser.profileComplete;
      token.companyComplete = existingUser.companyComplete;
      token.hasPaid = existingUser.hasPaid;


      return token;
    }
  },
  adapter: PrismaAdapter(client),
  session: { strategy: "jwt" },
  ...authConfig,
});

