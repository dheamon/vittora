"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Building2, FileText, Lock, Pencil, Trash2, Users } from "lucide-react";
import type { ClientDTO, UserDTO } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import { initials, avatarColor, formatDate, typeLabel } from "@/lib/ui";
import { useClientModal } from "./ClientModalProvider";
import { SecretInline } from "./SecretCell";
import { useToast } from "./ToastProvider";

export default function ClientDetail({
  client,
  currentUser,
}: {
  client: ClientDTO;
  currentUser: SessionUser;
}) {
  const router = useRouter();
  const { openEdit, confirmDelete } = useClientModal();
  const { toast } = useToast();
  const [bg, fg] = avatarColor(client.id);
  const isCompany = client.type === "COMPANY";
  const isAdmin = currentUser.role === "Admin";

  const [allUsers, setAllUsers] = useState<UserDTO[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(
    new Set(client.assignedUserIds),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setAllUsers(data))
      .catch(() => {});
  }, [isAdmin]);

  async function saveAssignments(ids: Set<string>) {
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: Array.from(ids) }),
    });
    if (res.ok) {
      toast("Assignments updated", "Client access has been updated");
    }
    setSaving(false);
  }

  function toggleUser(userId: string) {
    const next = new Set(assignedIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setAssignedIds(next);
    saveAssignments(next);
  }

  const nonAdminUsers = allUsers.filter((u) => u.role === "USER");

  return (
    <div className="view">
      <button className="back-link" onClick={() => router.push("/clients")}>
        <ArrowLeft /> Back to clients
      </button>

      <div className="profile-head">
        <div className="big-av" style={{ background: bg, color: fg }}>
          {initials(client.name)}
        </div>
        <div>
          <h2>{client.name}</h2>
          <div className="meta-line">
            <span className={`badge ${isCompany ? "b-co" : "b-ind"}`}>
              {typeLabel(client.type)}
            </span>
            <span className="mono">{client.pan}</span>
            <span>·</span>
            <span>Updated {formatDate(client.updatedAt)}</span>
          </div>
          {client.createdByName && (
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Created by {client.createdByName}
            </div>
          )}
        </div>
        <div className="detail-actions">
          <button className="btn btn-ghost" onClick={() => openEdit(client)}>
            <Pencil /> Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={() =>
              confirmDelete(client, { onDeleted: () => router.push("/clients") })
            }
          >
            <Trash2 /> Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            {isCompany ? <Building2 /> : <User />}
            <h3>Personal details</h3>
          </div>
          <div className="panel-body">
            <Row label="Full name" value={client.name} />
            <Row label="PAN" value={client.pan} mono />
            <div className="drow">
              <span className="dl">Aadhaar</span>
              <span className="dv mono">
                <SecretInline value={client.aadhaar} />
              </span>
            </div>
            <Row
              label={isCompany ? "Date of formation" : "Date of birth"}
              value={(isCompany ? client.dof : client.dob) || "—"}
              mono
            />
            <Row label="Phone" value={client.phone || "—"} mono />
            <Row label="Email" value={client.email || "—"} />
            <Row label="Address" value={client.address || "—"} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <FileText />
            <h3>Tax details</h3>
          </div>
          <div className="panel-body">
            <div className="drow">
              <span className="dl">GST number</span>
              <span className="dv mono">
                {client.gstNumber || <span className="muted">Not registered</span>}
              </span>
            </div>
            <div className="drow">
              <span className="dl">Login password</span>
              <span className="dv mono">
                <SecretInline value={client.password} />
              </span>
            </div>
          </div>

          <div className="panel-head" style={{ borderTop: "1px solid var(--line)" }}>
            <Lock />
            <h3>Portal credentials</h3>
            <span className="lock">
              <Lock size={12} /> Sensitive
            </span>
          </div>
          <div className="panel-body">
            <Row label="Portal user ID" value={client.userId || "—"} mono />
            <div className="drow">
              <span className="dl">Portal password</span>
              <span className="dv mono">
                <SecretInline value={client.portalPassword} />
              </span>
            </div>
            <div className="drow">
              <span className="dl">
                AIS password <span className="ais-badge">Auto</span>
              </span>
              <span className="dv mono">
                <SecretInline value={client.aisPassword} />
              </span>
            </div>
            <div className="ais-hint">
              Generated as PAN + DOB. Regenerates automatically when DOB changes.
            </div>
          </div>
        </div>

        {isAdmin && nonAdminUsers.length > 0 && (
          <div className="panel">
            <div className="panel-head">
              <Users />
              <h3>Assigned users</h3>
              {saving && (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Saving…</span>
              )}
            </div>
            <div className="panel-body">
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Toggle users who should have access to this client
              </div>
              {nonAdminUsers.map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignedIds.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                    style={{ width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      @{u.username}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="drow">
      <span className="dl">{label}</span>
      <span className={`dv ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}
