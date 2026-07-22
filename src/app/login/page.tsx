"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input
            id="p"
            type="password"
            value={password}
            autoComplete="current-password"
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
      </form>
    </div>
  );
}
