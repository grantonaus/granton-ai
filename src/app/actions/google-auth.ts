"use server";

// This is now handled client-side via the authClient
// Keeping for backward compatibility but redirects to client-side handler
export async function handleGoogleSignin() {
  // Client-side will handle this via authClient.signIn.social
  return { url: null };
}
