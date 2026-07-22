import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { serializeClient } from "@/lib/serialize";
import { buildExportBuffer } from "@/lib/spreadsheet";

/** GET /api/clients/export?format=xlsx|csv&scope=full|basic */
export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const scope = searchParams.get("scope") === "basic" ? "basic" : "full";

  const clients = (
    await prisma.client.findMany({ orderBy: { name: "asc" } })
  ).map(serializeClient);

  const buffer = buildExportBuffer(clients, format, scope);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `vittora-clients-${scope}-${date}.${format}`;
  const contentType =
    format === "csv"
      ? "text/csv; charset=utf-8"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
