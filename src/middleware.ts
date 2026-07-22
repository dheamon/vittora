import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

// Routes that never require authentication.
const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Signed-in users shouldn't see the login page.
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated users are bounced to login (except public paths).
  if (!user && !isPublic) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect page routes. API routes self-guard via requireUser(), and static
  // assets are excluded.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
