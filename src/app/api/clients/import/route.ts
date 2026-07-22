import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { parseImportBuffer } from "@/lib/spreadsheet";
import { generateAisPassword } from "@/lib/ais";
import { isValidPan, isValidEmail, isValidGst, isValidPhone } from "@/lib/validation";

interface RowError {
  row: number;
  name: string;
  errors: string[];
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows;
  try {
    rows = parseImportBuffer(buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read the file. Upload a valid .xlsx or .csv." },
      { status: 400 },
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "The file has no data rows" }, { status: 400 });
  }

  const existing = new Set(
    (await prisma.client.findMany({ select: { pan: true } })).map((c) => c.pan),
  );
  const seenInFile = new Set<string>();

  const errors: RowError[] = [];
  const valid: typeof rows = [];

  for (const row of rows) {
    const rowErrors: string[] = [];
    if (!row.pan) rowErrors.push("Missing PAN");
    else if (!isValidPan(row.pan)) rowErrors.push("Invalid PAN format");
    else if (existing.has(row.pan)) rowErrors.push("Duplicate PAN (already exists)");
    else if (seenInFile.has(row.pan)) rowErrors.push("Duplicate PAN (repeated in file)");

    if (!row.name) rowErrors.push("Missing client name");
    if (row.email && !isValidEmail(row.email)) rowErrors.push("Invalid email");
    if (row.gstNumber && !isValidGst(row.gstNumber)) rowErrors.push("Invalid GST");
    if (row.phone && !isValidPhone(row.phone)) rowErrors.push("Invalid phone");

    if (rowErrors.length > 0) {
      errors.push({ row: row.rowNumber, name: row.name || "(unnamed)", errors: rowErrors });
    } else {
      seenInFile.add(row.pan);
      valid.push(row);
    }
  }

  let imported = 0;
  for (const row of valid) {
    await prisma.client.create({
      data: {
        type: row.type,
        name: row.name,
        pan: row.pan,
        password: row.password,
        aadhaar: row.aadhaar,
        dob: row.dob,
        dof: row.dof,
        phone: row.phone,
        email: row.email,
        address: row.address,
        gstNumber: row.gstNumber,
        userId: row.userId,
        portalPassword: row.portalPassword,
        aisPassword: generateAisPassword(row.pan, row.dob),
        createdById: auth.id,
      },
    });
    imported += 1;
  }

  return NextResponse.json({
    total: rows.length,
    imported,
    failed: errors.length,
    errors,
  });
}
