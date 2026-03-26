import { describe, it, expect } from "vitest";
import { signJWT, verifyJWT } from "../jwt";

describe("jwt", () => {
  it("signs and verifies a payload", async () => {
    const token = await signJWT(
      { id: "user_1", email: "a@example.com" },
      3600
    );
    const payload = await verifyJWT(token);
    expect(payload?.id).toBe("user_1");
    expect(payload?.email).toBe("a@example.com");
  });

  it("returns null for a tampered token", async () => {
    const token = await signJWT({ id: "x" }, 3600);
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1] ?? ""}x.${parts[2] ?? ""}`;
    expect(await verifyJWT(tampered)).toBeNull();
  });

  it("returns null for malformed input", async () => {
    expect(await verifyJWT("not-a-jwt")).toBeNull();
    expect(await verifyJWT("a.b")).toBeNull();
  });
});
