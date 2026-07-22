import { z } from "zod";

/**
 * Field-level validators shared across the add/edit form, the API layer and
 * the bulk importer. Keeping them in one place guarantees consistent rules.
 */

// PAN: 5 letters, 4 digits, 1 letter — e.g. ABCDE1234F
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
// GSTIN: 15 chars — 2 digit state code + PAN + entity + Z + checksum
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidPan(v: string): boolean {
  return PAN_REGEX.test(v.trim().toUpperCase());
}
export function isValidGst(v: string): boolean {
  return GST_REGEX.test(v.trim().toUpperCase());
}
export function isValidEmail(v: string): boolean {
  return EMAIL_REGEX.test(v.trim());
}
export function isValidPhone(v: string): boolean {
  // Accepts formatting characters; requires at least 10 digits.
  return v.replace(/\D/g, "").length >= 10;
}

export const clientTypeSchema = z.enum(["INDIVIDUAL", "COMPANY"]);

/** Schema for creating / updating a client via the API. */
export const clientInputSchema = z
  .object({
    type: clientTypeSchema.default("INDIVIDUAL"),
    name: z.string().trim().min(1, "Client name is required"),
    pan: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .refine((v) => PAN_REGEX.test(v), "Invalid PAN (format AAAAA0000A)"),
    password: z.string().trim().optional().nullable(),
    aadhaar: z.string().trim().optional().nullable(),
    dob: z.string().trim().optional().nullable(),
    dof: z.string().trim().optional().nullable(),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((v) => !v || isValidPhone(v), "Phone needs at least 10 digits"),
    email: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((v) => !v || EMAIL_REGEX.test(v), "Invalid email address"),
    address: z.string().trim().optional().nullable(),
    gstNumber: z
      .string()
      .trim()
      .transform((v) => (v ? v.toUpperCase() : v))
      .optional()
      .nullable()
      .refine((v) => !v || GST_REGEX.test(v), "Invalid GSTIN (15-char format)"),
    userId: z.string().trim().optional().nullable(),
    portalPassword: z.string().trim().optional().nullable(),
  })
  .transform((c) => ({
    ...c,
    // Individuals keep DOB; companies keep DOF. Blank the irrelevant one.
    dob: c.type === "INDIVIDUAL" ? c.dob || null : null,
    dof: c.type === "COMPANY" ? c.dof || null : null,
  }));

export type ClientInput = z.infer<typeof clientInputSchema>;
