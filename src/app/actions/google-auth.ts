"use server"

import { signIn } from "../../../auth";


export async function handleGoogleSignin() {
    await signIn("google", { redirectTo: "/new-application" });
}