"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { useToast } from "./ToastProvider";

type Scope = "full" | "basic";

export default function ExportView() {
  const { toast } = useToast();
  const [scope, setScope] = useState<Scope>("full");

  function download(format: "xlsx" | "csv") {
    toast("Export queued", `Preparing ${scope} export (${format.toUpperCase()})…`);
    // Trigger a file download via a transient anchor.
    const a = document.createElement("a");
    a.href = `/api/clients/export?format=${format}&scope=${scope}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2>Export clients</h2>
          <div className="sub">Download your register for backup or filing</div>
        </div>
      </div>

      <div className="info-panel" style={{ maxWidth: 560 }}>
        <h3>What to include</h3>
        <p>
          Basic details are safe to share. Full export contains portal and AIS
          credentials — handle per DPDPA.
        </p>
        <div className="radio-row">
          <div
            className={`radio-card ${scope === "full" ? "on" : ""}`}
            onClick={() => setScope("full")}
          >
            <div className="rt">Full details</div>
            <div className="rd">All fields incl. credentials</div>
          </div>
          <div
            className={`radio-card ${scope === "basic" ? "on" : ""}`}
            onClick={() => setScope("basic")}
          >
            <div className="rt">Basic details only</div>
            <div className="rd">Name, PAN, contact, GST</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            className="btn btn-primary"
            style={{ padding: "11px 18px" }}
            onClick={() => download("xlsx")}
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: "11px 18px" }}
            onClick={() => download("csv")}
          >
            Export CSV
          </button>
        </div>
        {scope === "full" ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 12.5,
              color: "var(--warn)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Lock size={14} /> Full export includes sensitive credentials. Store
            securely.
          </div>
        ) : null}
      </div>
    </div>
  );
}
