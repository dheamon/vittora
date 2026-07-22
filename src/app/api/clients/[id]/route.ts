import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { serializeClient } from "@/lib/serialize";
import { clientInputSchema } from "@/lib/validation";
import { generateAisPassword } from "@/lib/ais";

interface Params {
  params: { id: string };
}

/** GET /api/clients/:id */
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(serializeClient(client));
}

/** PATCH /api/clients/:id — update a client (AIS password regenerates). */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const parsed = clientInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const updated = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...input,
        // Regenerate AIS password whenever PAN/DOB change.
        aisPassword: generateAisPassword(input.pan, input.dob),
      },
    });
    return NextResponse.json(serializeClient(updated));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "A client with this PAN already exists" },
          { status: 409 },
        );
      }
    }
    throw e;
  }
}

/** DELETE /api/clients/:id */
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    await prisma.client.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    throw e;
  }
}
