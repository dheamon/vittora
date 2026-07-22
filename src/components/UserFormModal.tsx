"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { UserDTO } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface Props {
  editing: UserDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ editing, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    username: editing?.username ?? "",
    name: editing?.name ?? "",
    password: "",
    role: editing?.role ?? "USER",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const method = editing ? "PATCH" : "POST";

    const body: Record<string, string> = {
      name: form.name,
      role: form.role,
    };
    if (!editing) body.username = form.username;
    if (form.password) body.password = form.password;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        setBusy(false);
        return;
      }

      toast(
        editing ? "User updated" : "User created",
        `${form.name} has been ${editing ? "updated" : "added"}`,
      );
      onSaved();
    } catch {
      setError("Network error");
      setBusy(false);
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit} style={{ maxWidth: 440 }}>
        <div className="mhead">
          <h3>{editing ? "Edit user" : "Add user"}</h3>
          <button type="button" className="close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mbody" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label>Username</label>
            <input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              disabled={!!editing}
              placeholder="e.g. priya_ca"
              required={!editing}
              autoComplete="off"
            />
            {editing && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Username cannot be changed
              </div>
            )}
          </div>

          <div className="field">
            <label>Full name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Priya Nair"
              required
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>{editing ? "New password (leave blank to keep)" : "Password"}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={editing ? "Unchanged" : "Min 6 characters"}
              required={!editing}
              minLength={editing ? undefined : 6}
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label>Role</label>
            <div className="toggle-row" style={{ display: "flex", gap: 0 }}>
              <button
                type="button"
                className={`toggle-btn ${form.role === "USER" ? "on" : ""}`}
                onClick={() => set("role", "USER")}
              >
                User
              </button>
              <button
                type="button"
                className={`toggle-btn ${form.role === "ADMIN" ? "on" : ""}`}
                onClick={() => set("role", "ADMIN")}
              >
                Admin
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {form.role === "ADMIN"
                ? "Full access to all clients and user management"
                : "Access only to created or assigned clients"}
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="mfoot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
