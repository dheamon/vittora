/**
 * Auto-generated AIS (Annual Information Statement) password.
 *
 * Rule: AIS Password = PAN + DOB (digits only), upper-cased.
 *   PAN: ABCDE1234F
 *   DOB: 01/01/1995
 *   => ABCDE1234F01011995
 *
 * The value is regenerated automatically whenever PAN or DOB change.
 * For companies (no DOB) there is no AIS password.
 */
export function generateAisPassword(
  pan: string | null | undefined,
  dob: string | null | undefined,
): string | null {
  if (!pan || !dob) return null;
  const digits = dob.replace(/\D/g, "");
  if (!digits) return null;
  return (pan + digits).toUpperCase();
}
