import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";

// HTTP Basic Auth gate. Railway has no built-in password protection, so this
// keeps real prospect data off the open web. If DASHBOARD_PASSWORD is unset
// (local dev), access is allowed.

export function isAuthorized(header: string | null): boolean {
  const password = appConfig.auth.password;
  if (!password) return true; // dev: no password configured → open
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return false;
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return user === appConfig.auth.user && pass === password;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  if (isAuthorized(req.headers.get("authorization"))) {
    return NextResponse.next();
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CEVA Repatriation Signal Engine"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
