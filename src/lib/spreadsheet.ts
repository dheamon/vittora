import * as XLSX from "xlsx";
import type { ClientDTO, ClientType } from "./types";

/**
 * Canonical import template column order. The importer maps these headers
 * (case-insensitive) to client fields.
 */
export const TEMPLATE_COLUMNS = [
  "Client Name",
  "PAN",
  "Password",
  "Aadhaar",
  "DOB",
  "DOF",
  "Phone",
  "Email",
  "Address",
  "GST Number",
  "Portal User ID",
  "Portal Password",
] as const;

// Basic export omits sensitive credentials.
const BASIC_COLUMNS = [
  "Client Name",
  "Type",
  "PAN",
  "Phone",
  "Email",
  "GST Number",
] as const;

// Full export includes everything, including auto-generated AIS password.
const FULL_COLUMNS = [
  "Client Name",
  "Type",
  "PAN",
  "Password",
  "Aadhaar",
  "DOB",
  "DOF",
  "Phone",
  "Email",
  "Address",
  "GST Number",
  "Portal User ID",
  "Portal Password",
  "AIS Password",
  "Created At",
  "Updated At",
] as const;

/** One example row so the template is self-documenting. */
const TEMPLATE_EXAMPLE: Record<(typeof TEMPLATE_COLUMNS)[number], string> = {
  "Client Name": "Aarav Sharma",
  PAN: "ABCDE1234F",
  Password: "Aarav@2024",
  Aadhaar: "1234 5678 9012",
  DOB: "01/01/1995",
  DOF: "",
  Phone: "+91 98450 11223",
  Email: "aarav.sharma@example.com",
  Address: "42, MG Road, Bengaluru, Karnataka 560001",
  "GST Number": "",
  "Portal User ID": "AARAVS95",
  "Portal Password": "ITportal#95",
};

function autoWidths(rows: Record<string, unknown>[], headers: readonly string[]) {
  return headers.map((h) => {
    const maxCell = rows.reduce(
      (m, r) => Math.max(m, String(r[h] ?? "").length),
      h.length,
    );
    return { wch: Math.min(Math.max(maxCell + 2, 10), 40) };
  });
}

/** Build the downloadable import template as an .xlsx or .csv buffer. */
export function buildTemplateBuffer(format: "xlsx" | "csv"): Buffer {
  const rows = [TEMPLATE_EXAMPLE];
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...TEMPLATE_COLUMNS] });
  ws["!cols"] = autoWidths(rows, TEMPLATE_COLUMNS);
  if (format === "csv") {
    return Buffer.from(XLSX.utils.sheet_to_csv(ws), "utf-8");
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function clientToRow(c: ClientDTO, scope: "full" | "basic"): Record<string, string> {
  const typeLabel = c.type === "COMPANY" ? "Company" : "Individual";
  if (scope === "basic") {
    return {
      "Client Name": c.name,
      Type: typeLabel,
      PAN: c.pan,
      Phone: c.phone ?? "",
      Email: c.email ?? "",
      "GST Number": c.gstNumber ?? "",
    };
  }
  return {
    "Client Name": c.name,
    Type: typeLabel,
    PAN: c.pan,
    Password: c.password ?? "",
    Aadhaar: c.aadhaar ?? "",
    DOB: c.dob ?? "",
    DOF: c.dof ?? "",
    Phone: c.phone ?? "",
    Email: c.email ?? "",
    Address: c.address ?? "",
    "GST Number": c.gstNumber ?? "",
    "Portal User ID": c.userId ?? "",
    "Portal Password": c.portalPassword ?? "",
    "AIS Password": c.aisPassword ?? "",
    "Created At": c.createdAt,
    "Updated At": c.updatedAt,
  };
}

/** Build an export file (all clients) as an .xlsx or .csv buffer. */
export function buildExportBuffer(
  clients: ClientDTO[],
  format: "xlsx" | "csv",
  scope: "full" | "basic",
): Buffer {
  const headers = scope === "basic" ? BASIC_COLUMNS : FULL_COLUMNS;
  const rows = clients.map((c) => clientToRow(c, scope));
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...headers] });
  ws["!cols"] = autoWidths(rows, headers);
  if (format === "csv") {
    return Buffer.from(XLSX.utils.sheet_to_csv(ws), "utf-8");
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export interface ParsedImportRow {
  rowNumber: number;
  type: ClientType;
  name: string;
  pan: string;
  password: string | null;
  aadhaar: string | null;
  dob: string | null;
  dof: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  userId: string | null;
  portalPassword: string | null;
}

function pick(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    // Case-insensitive header match.
    const found = Object.keys(row).find(
      (rk) => rk.trim().toLowerCase() === k.toLowerCase(),
    );
    if (found != null) {
      const v = row[found];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return null;
}

/** Parse an uploaded .xlsx or .csv buffer into normalized rows. */
export function parseImportBuffer(buffer: Buffer): ParsedImportRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return raw.map((row, i) => {
    const dob = pick(row, "DOB", "Date of Birth");
    const dof = pick(row, "DOF", "Date of Formation");
    return {
      rowNumber: i + 2, // +1 header, +1 to 1-index
      type: dof && !dob ? "COMPANY" : "INDIVIDUAL",
      name: pick(row, "Client Name", "Name") ?? "",
      pan: (pick(row, "PAN") ?? "").toUpperCase(),
      password: pick(row, "Password"),
      aadhaar: pick(row, "Aadhaar", "Aadhar"),
      dob,
      dof,
      phone: pick(row, "Phone", "Phone Number", "Mobile"),
      email: pick(row, "Email"),
      address: pick(row, "Address"),
      gstNumber: pick(row, "GST Number", "GST", "GSTIN")?.toUpperCase() ?? null,
      userId: pick(row, "Portal User ID", "User ID", "Portal ID"),
      portalPassword: pick(row, "Portal Password"),
    };
  });
}
