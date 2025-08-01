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
    // async signIn({ user, account }) {
    //   if (account?.provider !== "credentials") return true;

    //   const existingUser = await getUserById(user.id as string);


    //   return true;
    // },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
    
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
          // Don't block login
        }
      }
    
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
    // async jwt({ token }) {
    //   if (!token.sub) return token;

    //   const existingUser = await getUserById(token.sub);

    //   if (!existingUser) return token;

    //   const existingAccount = await getAccountByUserId(
    //     existingUser.id
    //   );

    //   token.isOAuth = !!existingAccount;
    //   token.firstName = existingUser.firstName;
    //   token.lastName = existingUser.lastName;
    //   token.email = existingUser.email;
    //   token.profileComplete = existingUser.profileComplete;
    //   token.companyComplete = existingUser.companyComplete;
    //   token.hasPaid = existingUser.hasPaid;


    //   return token;
    // }

    async jwt({ token, user }) {
      if (!token.sub && !user) return token;
    
      // Extract first and last name from Google OAuth user on first sign-in
      if (user && user.name && !token.firstName && !token.lastName) {
        const name = user.name.trim();
        const [firstName, ...rest] = name.split(" ");
        const lastName = rest.join(" ");
    
        token.firstName = firstName;
        token.lastName = lastName;
        token.email = user.email || "";
      }
    
      if (token.sub) {
        const existingUser = await getUserById(token.sub);
        if (!existingUser) return token;
    
        const existingAccount = await getAccountByUserId(existingUser.id);
    
        token.isOAuth = !!existingAccount;
        token.firstName = existingUser.firstName;
        token.lastName = existingUser.lastName;
        token.email = existingUser.email;
        token.profileComplete = existingUser.profileComplete;
        token.companyComplete = existingUser.companyComplete;
        token.hasPaid = existingUser.hasPaid;
      }
    
      return token;
    }
  },
  adapter: PrismaAdapter(client),
  session: { strategy: "jwt" },
  ...authConfig,
});

