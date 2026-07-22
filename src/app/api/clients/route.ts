import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { serializeClient } from "@/lib/serialize";
import { clientInputSchema } from "@/lib/validation";
import { generateAisPassword } from "@/lib/ais";
import type { ClientListResponse, SortKey } from "@/lib/types";

const SORT_KEYS: SortKey[] = ["name", "pan", "createdAt", "updatedAt"];

/** GET /api/clients — searchable, filterable, sortable, paginated list + stats. */
export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const filter = (searchParams.get("filter") || "all").toLowerCase();
  const sortKeyRaw = (searchParams.get("sortKey") || "name") as SortKey;
  const sortKey: SortKey = SORT_KEYS.includes(sortKeyRaw) ? sortKeyRaw : "name";
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("perPage") || "10", 10) || 10),
  );

  const where: Prisma.ClientWhereInput = {};
  if (filter === "individual") where.type = "INDIVIDUAL";
  else if (filter === "company") where.type = "COMPANY";

  if (search) {
    // Search by name, PAN, phone, GST and email.
    where.OR = [
      { name: { contains: search } },
      { pan: { contains: search } },
      { phone: { contains: search } },
      { gstNumber: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [total, rows, allForStats] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { [sortKey]: sortDir },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.client.findMany({
      select: { type: true, name: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const individuals = allForStats.filter((c) => c.type === "INDIVIDUAL").length;
  const companies = allForStats.filter((c) => c.type === "COMPANY").length;
  const last = allForStats[0];

  const body: ClientListResponse = {
    data: rows.map(serializeClient),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    stats: {
      total: allForStats.length,
      individuals,
      companies,
      lastUpdated: last
        ? { name: last.name, updatedAt: last.updatedAt.toISOString() }
        : null,
    },
  };
  return NextResponse.json(body);
}

/** POST /api/clients — create a client. */
export async function POST(req: Request) {
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
    const created = await prisma.client.create({
      data: {
        ...input,
        aisPassword: generateAisPassword(input.pan, input.dob),
      },
    });
    return NextResponse.json(serializeClient(created), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A client with this PAN already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}
