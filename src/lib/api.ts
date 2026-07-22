import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionUser } from "./auth";

/**
 * Guard for API route handlers. Returns the session user, or a 401 response
 * to return early.
 *
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is a SessionUser here
 */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
