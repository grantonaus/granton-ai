import dns from "node:dns/promises";
import net from "node:net";

/**
 * Block obvious SSRF targets before server-side fetch().
 * Resolves hostnames and rejects private/link-local/reserved IPs.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal",
  "metadata",
]);

function isBlockedIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false;
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  // Unique local fc00::/7
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  return false;
}

function ipLooksBlocked(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isBlockedIPv6(ip);
  return true;
}

export async function assertUrlSafeForServerFetch(
  raw: string
): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Invalid URL");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error("Host not allowed");
  }
  if (host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Host not allowed");
  }

  if (net.isIP(host)) {
    if (ipLooksBlocked(host)) {
      throw new Error("Address not allowed");
    }
    return u;
  }

  try {
    const results = await dns.lookup(host, { all: true });
    for (const r of results) {
      if (ipLooksBlocked(r.address)) {
        throw new Error("Resolved address not allowed");
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Resolved address not allowed") {
      throw e;
    }
    throw new Error("Could not resolve host safely");
  }

  return u;
}

/** Max size for a single uploaded file in form-data routes (bytes). */
export const MAX_FORM_FILE_BYTES = 12 * 1024 * 1024; // 12 MB

/** Max Content-Length for JSON AI routes (bytes). */
export const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

export function assertContentLengthOk(
  request: Request,
  maxBytes: number
): void {
  const cl = request.headers.get("content-length");
  if (!cl) return;
  const n = parseInt(cl, 10);
  if (Number.isFinite(n) && n > maxBytes) {
    throw new Error("Request body too large");
  }
}

export function assertFileSizeOk(file: File, maxBytes: number): void {
  if (file.size > maxBytes) {
    throw new Error("File too large");
  }
}
