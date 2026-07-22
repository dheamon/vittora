"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  // Development credentials are auto-filled (see AUTH docs in README).
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign-in failed");
        setLoading(false);
        return;
      }
      toast("Signed in", "Welcome back");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={doLogin}>
        <div className="brand">
          <div className="glyph" />
          <div>
            <div className="brand-name">Vittora</div>
            <div className="brand-sub">CA Practice Suite</div>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="lede">Sign in to manage your client register.</p>

        <div className="field">
          <label htmlFor="u">Username</label>
          <input
            id="u"
            type="text"
            value={username}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            value={password}
            autoComplete="off"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? (
            <span className="mono" style={{ fontSize: 13 }}>
              Signing in…
            </span>
          ) : (
            <>
              <LogIn size={16} />
              Login
            </>
          )}
        </button>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="dev-note">
          <span className="tag">Dev mode</span> &nbsp;Auto-filled credentials —{" "}
          <b>admin</b> / <b>admin123</b>. The auth layer is stubbed so a real
          provider can drop in later.
        </div>
      </form>
    </div>
  );
}
