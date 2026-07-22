"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { mask } from "@/lib/ui";

/** A table cell that masks a secret with a reveal toggle. */
export default function SecretCell({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  return (
    <td onClick={(e) => e.stopPropagation()}>
      <span className="secret">
        <span className="val mono">{shown ? value || "—" : mask(value)}</span>
        {value ? (
          <button
            className="eye"
            onClick={() => setShown((s) => !s)}
            title={shown ? "Hide" : "Reveal"}
          >
            {shown ? <EyeOff /> : <Eye />}
          </button>
        ) : null}
      </span>
    </td>
  );
}

/** Inline reveal used on the details page. */
export function SecretInline({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="muted">—</span>;
  return (
    <span className="secret">
      <span className="val">{shown ? value : mask(value)}</span>
      <button className="eye" onClick={() => setShown((s) => !s)}>
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </span>
  );
}
