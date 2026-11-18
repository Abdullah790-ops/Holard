import { NextResponse, type NextRequest } from "next/server";

// Fast first gate: no session cookie → straight to login. Every page and action still checks the
// session and role on the server (see src/server/auth.ts) — this is not the only protection.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("holard_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/portal/:path*", "/account/:path*", "/api/admin/:path*"] };
