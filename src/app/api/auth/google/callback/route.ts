import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { createSession } from "@/lib/auth-custom";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = req.cookies.get("oauth_state")?.value;

    // Verify state
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", BASE_URL));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", BASE_URL));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", BASE_URL));
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=user_info_failed", BASE_URL));
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await client.user.findUnique({
      where: { email: googleUser.email },
      include: { accounts: true },
    });

    if (!user) {
      // Create new user
      const [firstName, ...rest] = (googleUser.name || "").trim().split(" ");
      const lastName = rest.join(" ") || "";

      await client.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          firstName,
          lastName,
          image: googleUser.picture,
          emailVerified: new Date(),
          contactSalutation: "",
          contactJobTitle: "",
          contactFirstName: firstName,
          contactLastName: lastName,
          contactEmail: googleUser.email,
          contactMobile: "",
        },
      });

      // Fetch user with accounts after creation
      user = await client.user.findUnique({
        where: { email: googleUser.email },
        include: { accounts: true },
      });
    } else {
      // Update existing user if needed
      const [firstName, ...rest] = (googleUser.name || "").trim().split(" ");
      const lastName = rest.join(" ") || "";

      await client.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          image: googleUser.picture || user.image,
        },
      });
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_creation_failed", BASE_URL));
    }

    // Create or update OAuth account
    await client.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleUser.id,
        },
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        token_type: tokens.token_type,
        id_token: tokens.id_token,
      },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleUser.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        token_type: tokens.token_type,
        id_token: tokens.id_token,
      },
    });

    // Create session
    await createSession(user.id);

    // Get callback URL from state
    let callbackUrl = "/grant-database";
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      callbackUrl = stateData.callbackUrl || "/grant-database";
    } catch (e) {
      // Use default if state parsing fails
    }

    // Clear OAuth state cookie
    const response = NextResponse.redirect(new URL(callbackUrl, BASE_URL));
    response.cookies.delete("oauth_state");

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_error", BASE_URL));
  }
}
