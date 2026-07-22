"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Download } from "lucide-react";
import { useToast } from "./ToastProvider";
import { emitClientsChanged } from "./ClientModalProvider";

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: { row: number; name: string; errors: string[] }[];
}

const TEMPLATE_COLUMNS = [
  "Client Name", "PAN", "Password", "Aadhaar", "DOB", "DOF",
  "Phone", "Email", "Address", "GST Number", "Portal User ID", "Portal Password",
];
const VALIDATIONS = ["Missing PAN", "Duplicate PAN", "Invalid email", "Invalid GST", "Invalid phone"];

export default function ImportView() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setResult(null);
    toast("Parsing file", "Validating rows…");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/clients/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast("Import failed", data.error || "Could not process the file", "err");
        setBusy(false);
        return;
      }
      setResult(data);
      const type = data.failed > 0 ? "warn" : "ok";
      toast(
        "Import complete",
        `${data.imported} imported · ${data.failed} failed`,
        type,
      );
      if (data.imported > 0) {
        emitClientsChanged();
        router.refresh();
      }
    } catch {
      toast("Network error", "Please try again", "err");
    } finally {
      setBusy(false);
    }
  }

  function onFile(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2>Import clients</h2>
          <div className="sub">Bulk-add clients from a spreadsheet</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={(e) => onFile(e.target.files)}
          />
          <div
            className={`drop ${dragging ? "drag" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFile(e.dataTransfer.files);
            }}
          >
            <div className="dico">
              <UploadCloud size={24} />
            </div>
            <h3>{busy ? "Uploading…" : "Drop your file here"}</h3>
            <p>or click to browse · .xlsx or .csv</p>
          </div>

          {result ? (
            <div className="report">
              <div className="report-row" style={{ fontWeight: 700 }}>
                <span>
                  Import summary — {result.imported} of {result.total} imported
                </span>
              </div>
              <div className="report-row">
                <span className="dot dot-ok" /> {result.imported} clients imported
                successfully
              </div>
              {result.failed > 0 ? (
                <div className="report-row">
                  <span className="dot dot-err" /> {result.failed} failed validation
                </div>
              ) : null}
              {result.errors.map((e, i) => (
                <div className="report-row" key={i}>
                  <span className="dot dot-warn" /> Row {e.row} ({e.name}):{" "}
                  {e.errors.join(", ")}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="info-panel">
          <h3>Download the template</h3>
          <p>Use the standard column order so the importer maps every field correctly.</p>
          <a
            className="btn btn-primary"
            style={{ padding: "10px 16px" }}
            href="/api/clients/template?format=xlsx"
          >
            <Download size={16} /> Excel template (.xlsx)
          </a>
          <a
            className="btn btn-ghost"
            style={{ padding: "10px 16px", marginLeft: 8 }}
            href="/api/clients/template?format=csv"
          >
            CSV
          </a>

          <div style={{ marginTop: 18 }}>
            <div className="form-sec" style={{ marginTop: 0 }}>
              Template columns
            </div>
            <div className="chips">
              {TEMPLATE_COLUMNS.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="form-sec" style={{ marginTop: 0 }}>
              Validated on import
            </div>
            <div className="chips">
              {VALIDATIONS.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
