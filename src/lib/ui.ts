import type { ClientType } from "./types";

/** Two-letter initials from a name, for avatars. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Deterministic avatar colour pairs [background, foreground].
const AVATAR_COLORS: Array<[string, string]> = [
  ["#E3EEFB", "#2563A8"],
  ["#E4F0EA", "#0F7A56"],
  ["#FBF3E3", "#B7791F"],
  ["#F3E8F7", "#8E44AD"],
  ["#FBEBE9", "#C0392B"],
  ["#E7F4F5", "#1B8A8F"],
];

export function avatarColor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Mask a secret value with bullets, capped at 10 chars. */
export function mask(v: string | null | undefined): string {
  return v ? "•".repeat(Math.min(v.length, 10)) : "—";
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO date string as e.g. "18 Jun 2025". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function typeLabel(type: ClientType): string {
  return type === "COMPANY" ? "Company" : "Individual";
}
