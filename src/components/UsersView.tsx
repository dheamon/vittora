"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, User } from "lucide-react";
import type { UserDTO } from "@/lib/types";
import { formatDate } from "@/lib/ui";
import { useToast } from "./ToastProvider";
import UserFormModal from "./UserFormModal";
import ConfirmDialog from "./ConfirmDialog";

export default function UsersView() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState<UserDTO | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(u: UserDTO) {
    setEditing(u);
    setFormOpen(true);
  }

  async function doDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("User deleted", `${deleting.name} has been removed`);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast("Error", data.error || "Could not delete user", "err");
    }
    setDeleting(null);
  }

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <div className="sub">Manage practice staff accounts</div>
        </div>
        <button className="btn btn-add" onClick={openAdd}>
          <Plus size={18} />
          <span>Add user</span>
        </button>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="empty">
            <div className="eico">
              <User size={26} />
            </div>
            <h3>No users yet</h3>
            <p>Add a user to get started.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Clients</th>
                <th>Created</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          background: u.role === "ADMIN" ? "var(--accent)" : "var(--primary)",
                          color: "#fff",
                        }}
                      >
                        {u.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="mono">{u.username}</td>
                  <td>
                    <span
                      className={`badge ${u.role === "ADMIN" ? "b-co" : "b-ind"}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      {u.role === "ADMIN" ? <Shield size={12} /> : <User size={12} />}
                      {u.role === "ADMIN" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>{u.clientCount}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 13 }}
                        onClick={() => openEdit(u)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 8px", fontSize: 13 }}
                        onClick={() => setDeleting(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <UserFormModal
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete user"
          message={`Are you sure you want to delete "${deleting.name}"? Their created clients will remain but won't be assigned to anyone.`}
          confirmLabel="Delete"
          onConfirm={doDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
