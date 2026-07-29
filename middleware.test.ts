import { it, expect, vi, beforeEach, afterEach } from "vitest";

// The auth check reads config at import time, so set env before importing.
async function loadWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return await import("./middleware");
}

const basic = (u: string, p: string) => "Basic " + Buffer.from(`${u}:${p}`).toString("base64");

afterEach(() => {
  delete process.env.DASHBOARD_USER;
  delete process.env.DASHBOARD_PASSWORD;
});

it("allows all requests when no password is configured (dev)", async () => {
  const { isAuthorized } = await loadWithEnv({ DASHBOARD_PASSWORD: undefined });
  expect(isAuthorized(null)).toBe(true);
});

it("accepts a valid Basic credential", async () => {
  const { isAuthorized } = await loadWithEnv({ DASHBOARD_USER: "ceva", DASHBOARD_PASSWORD: "s3cret" });
  expect(isAuthorized(basic("ceva", "s3cret"))).toBe(true);
});

it("rejects a wrong password", async () => {
  const { isAuthorized } = await loadWithEnv({ DASHBOARD_USER: "ceva", DASHBOARD_PASSWORD: "s3cret" });
  expect(isAuthorized(basic("ceva", "nope"))).toBe(false);
});

it("rejects a missing header", async () => {
  const { isAuthorized } = await loadWithEnv({ DASHBOARD_USER: "ceva", DASHBOARD_PASSWORD: "s3cret" });
  expect(isAuthorized(null)).toBe(false);
});
