import { describe, it, expect } from "vitest";
import { assertContentLengthOk } from "../url-safety";

describe("url-safety", () => {
  it("assertContentLengthOk throws when Content-Length exceeds max", () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-length": "5000000" },
    });
    expect(() => assertContentLengthOk(req, 1000)).toThrow("Request body too large");
  });

  it("assertContentLengthOk allows when Content-Length is within max", () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-length": "100" },
    });
    expect(() => assertContentLengthOk(req, 1000)).not.toThrow();
  });
});
