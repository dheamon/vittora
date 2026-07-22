"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, User, Building2, FileText, Lock, Pencil, Trash2 } from "lucide-react";
import type { ClientDTO } from "@/lib/types";
import { initials, avatarColor, formatDate, typeLabel } from "@/lib/ui";
import { useClientModal } from "./ClientModalProvider";
import { SecretInline } from "./SecretCell";

export default function ClientDetail({ client }: { client: ClientDTO }) {
  const router = useRouter();
  const { openEdit, confirmDelete } = useClientModal();
  const [bg, fg] = avatarColor(client.id);
  const isCompany = client.type === "COMPANY";

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
        {/* Personal details */}
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

        {/* Tax + portal credentials */}
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
