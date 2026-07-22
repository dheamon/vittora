/** Loading placeholder rows for the client table. */
export default function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: "8px 16px" }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="skel-row"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: "22%", height: 12 }} />
          <div className="skeleton" style={{ width: "14%", height: 12 }} />
          <div className="skeleton" style={{ width: "18%", height: 12 }} />
          <div className="skeleton" style={{ width: "12%", height: 12 }} />
        </div>
      ))}
    </div>
  );
}
