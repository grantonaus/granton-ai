import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
    firstName?: string;
    lastName?: string;
    profileComplete?: boolean;
    isOAuth: boolean;
    hasPaid?: boolean;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}