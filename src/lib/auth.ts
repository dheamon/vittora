/**
 * Authentication layer.
 *
 * This is intentionally a thin, self-contained implementation so that a real
 * identity provider (NextAuth, Clerk, Auth0, a database + bcrypt, …) can drop
 * in later by replacing `authenticate()` and the session helpers below — the
 * rest of the app only depends on `getSessionUser()` and the two cookie
 * helpers.
 *
 * Sessions are stateless signed cookies (HMAC-SHA256) verified with the Web
 * Crypto API so the same code runs in both the Edge middleware and Node route
 * handlers.
 */

export const SESSION_COOKIE = "vittora_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  username: string;
  name: string;
  role: string;
  firm: string;
}

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret";
}

/**
 * The single swap-point for real authentication. Today it checks the
 * development credentials from the environment; replace the body with a
 * database lookup + password hash comparison to go live.
 */
export async function authenticate(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const devUser = process.env.DEV_AUTH_USERNAME || "admin";
  const devPass = process.env.DEV_AUTH_PASSWORD || "admin123";
  if (username === devUser && password === devPass) {
    return {
      username: devUser,
      name: "Practice Admin",
      role: "Admin",
      firm: "Vittora & Co.",
    };
  }
  return null;
}

// --- base64url helpers (runtime-agnostic) ---------------------------------
function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Create a signed session token for a user. */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = toBase64Url(await hmac(payloadB64));
  return `${payloadB64}.${sig}`;
}

/** Verify a session token and return the user, or null if invalid/expired. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  try {
    const expected = await hmac(payloadB64);
    if (!timingSafeEqual(fromBase64Url(sig), expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return {
      username: payload.username,
      name: payload.name,
      role: payload.role,
      firm: payload.firm,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
