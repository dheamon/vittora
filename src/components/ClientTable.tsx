"use client";

import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { ClientDTO, SortDir, SortKey } from "@/lib/types";
import { initials, avatarColor, typeLabel } from "@/lib/ui";
import { useClientModal } from "./ClientModalProvider";
import SecretCell from "./SecretCell";

interface Props {
  rows: ClientDTO[];
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (key: SortKey) => void;
}

export default function ClientTable({ rows, sortKey, sortDir, onSort }: Props) {
  const router = useRouter();
  const { openEdit, confirmDelete } = useClientModal();

  const Th = ({ label, sortable }: { label: string; sortable?: SortKey }) => {
    if (!sortable || !onSort) return <th>{label}</th>;
    const sorted = sortKey === sortable;
    return (
      <th
        className={`sortable ${sorted ? "sorted" : ""}`}
        onClick={() => onSort(sortable)}
      >
        {label}
        <span className="arr">{sorted ? (sortDir === "asc" ? "▲" : "▼") : "▲"}</span>
      </th>
    );
  };

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <Th label="Client" sortable="name" />
            <Th label="PAN" sortable="pan" />
            <th>Password</th>
            <th>Phone</th>
            <th>Email</th>
            <th>GST No.</th>
            <th>Portal ID</th>
            <th>Portal Pwd</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const [bg, fg] = avatarColor(c.id);
            return (
              <tr key={c.id} onClick={() => router.push(`/clients/${c.id}`)}>
                <td>
                  <div className="cname">
                    <div className="cavatar" style={{ background: bg, color: fg }}>
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className="cn-main">{c.name}</div>
                      <span className={`badge ${c.type === "COMPANY" ? "b-co" : "b-ind"}`}>
                        {typeLabel(c.type)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="mono">{c.pan}</td>
                <SecretCell value={c.password} />
                <td className="mono">{c.phone || "—"}</td>
                <td>{c.email || "—"}</td>
                <td className="mono">
                  {c.gstNumber || <span className="muted">—</span>}
                </td>
                <td className="mono">{c.userId || "—"}</td>
                <SecretCell value={c.portalPassword} />
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="rowacts">
                    <button title="View" onClick={() => router.push(`/clients/${c.id}`)}>
                      <Eye />
                    </button>
                    <button title="Edit" onClick={() => openEdit(c)}>
                      <Pencil />
                    </button>
                    <button
                      title="Delete"
                      className="del"
                      onClick={() => confirmDelete(c)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
