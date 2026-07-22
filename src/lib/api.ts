import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSessionUser } from "./session";
import type { SessionUser } from "./auth";

export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export function clientAccessFilter(auth: SessionUser): Prisma.ClientWhereInput {
  if (auth.role === "Admin") return {};
  return {
    OR: [
      { createdById: auth.id },
      { assignedUsers: { some: { userId: auth.id } } },
    ],
  };
}
