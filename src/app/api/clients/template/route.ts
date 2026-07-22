import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { buildTemplateBuffer } from "@/lib/spreadsheet";

/** GET /api/clients/template?format=xlsx|csv — download the import template. */
export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const buffer = buildTemplateBuffer(format);
  const filename = `vittora-client-import-template.${format}`;
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
