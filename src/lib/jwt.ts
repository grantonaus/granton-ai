import { getAuthSecret } from "./auth-secret";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString();
}

export async function signJWT(
  payload: Record<string, unknown>,
  expiresIn: number
): Promise<string> {
  const secret = getAuthSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const token = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(token));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signatureInput)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signatureInput}.${signatureB64}`;
}

export async function verifyJWT(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const secret = getAuthSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();
    const signatureInput = `${parts[0]}.${parts[1]}`;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let base64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const signature = Uint8Array.from(Buffer.from(base64, "base64"));

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(signatureInput)
    );
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<
      string,
      unknown
    >;
    const exp = payload.exp;
    if (typeof exp === "number" && exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
