import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

const bodySchema = z.object({
  userIds: z.array(z.string()),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.clientUser.deleteMany({ where: { clientId: params.id } }),
    ...parsed.data.userIds.map((userId) =>
      prisma.clientUser.create({ data: { clientId: params.id, userId } }),
    ),
  ]);

  return NextResponse.json({ ok: true });
}
