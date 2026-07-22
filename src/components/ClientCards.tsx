"use client";

import { useRouter } from "next/navigation";
import type { ClientDTO } from "@/lib/types";
import { initials, avatarColor, typeLabel } from "@/lib/ui";
import { useClientModal } from "./ClientModalProvider";

/** Mobile card list — shown instead of the table on narrow screens. */
export default function ClientCards({ rows }: { rows: ClientDTO[] }) {
  const router = useRouter();
  const { openEdit, confirmDelete } = useClientModal();

  return (
    <div className="m-cards">
      {rows.map((c) => {
        const [bg, fg] = avatarColor(c.id);
        return (
          <div className="m-card" key={c.id}>
            <div className="top" onClick={() => router.push(`/clients/${c.id}`)}>
              <div
                className="cavatar"
                style={{ width: 40, height: 40, background: bg, color: fg }}
              >
                {initials(c.name)}
              </div>
              <div>
                <div className="cn-main">{c.name}</div>
                <span className={`badge ${c.type === "COMPANY" ? "b-co" : "b-ind"}`}>
                  {typeLabel(c.type)}
                </span>
              </div>
            </div>
            <div className="m-row">
              <span className="lbl">PAN</span>
              <span className="val mono">{c.pan}</span>
            </div>
            <div className="m-row">
              <span className="lbl">Phone</span>
              <span className="val mono">{c.phone || "—"}</span>
            </div>
            <div className="m-row">
              <span className="lbl">Email</span>
              <span className="val">{c.email || "—"}</span>
            </div>
            <div className="m-row">
              <span className="lbl">GST</span>
              <span className="val mono">{c.gstNumber || "—"}</span>
            </div>
            <div className="macts">
              <button className="btn view" onClick={() => router.push(`/clients/${c.id}`)}>
                View
              </button>
              <button className="btn" onClick={() => openEdit(c)}>
                Edit
              </button>
              <button
                className="btn"
                onClick={() => confirmDelete(c)}
                style={{ color: "var(--danger)" }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
