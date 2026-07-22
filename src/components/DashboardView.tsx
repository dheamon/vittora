"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, User, Building2, Clock } from "lucide-react";
import type { ClientListResponse } from "@/lib/types";
import { formatDate } from "@/lib/ui";
import { CLIENTS_CHANGED_EVENT } from "./ClientModalProvider";
import ClientTable from "./ClientTable";
import ClientCards from "./ClientCards";
import TableSkeleton from "./TableSkeleton";

export default function DashboardView() {
  const [data, setData] = useState<ClientListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/clients?sortKey=updatedAt&sortDir=desc&perPage=5&page=1",
      );
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener(CLIENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CLIENTS_CHANGED_EVENT, handler);
  }, [load]);

  const stats = data?.stats;
  const last = stats?.lastUpdated;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <div className="sub">Your client register at a glance</div>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="ico ic-green">
            <Users size={18} />
          </div>
          <div className="k">Total clients</div>
          <div className="v">{stats?.total ?? "—"}</div>
          <div className="d">Across all engagement types</div>
        </div>
        <div className="card">
          <div className="ico ic-blue">
            <User size={18} />
          </div>
          <div className="k">Individuals</div>
          <div className="v">{stats?.individuals ?? "—"}</div>
          <div className="d">Personal tax files</div>
        </div>
        <div className="card">
          <div className="ico ic-amber">
            <Building2 size={18} />
          </div>
          <div className="k">Companies</div>
          <div className="v">{stats?.companies ?? "—"}</div>
          <div className="d">Registered entities</div>
        </div>
        <div className="card">
          <div className="ico ic-slate">
            <Clock size={18} />
          </div>
          <div className="k">Last updated</div>
          <div className="v" style={{ fontSize: 16, lineHeight: 1.3, marginTop: 6 }}>
            {last ? last.name : "—"}
          </div>
          <div className="d">{last ? formatDate(last.updatedAt) : "No clients yet"}</div>
        </div>
      </div>

      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>Recent clients</h2>
        </div>
        <Link
          className="btn btn-ghost"
          href="/clients"
          style={{ fontSize: 13, padding: "8px 14px" }}
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="table-wrap">
          <TableSkeleton rows={5} />
        </div>
      ) : (data?.data.length ?? 0) === 0 ? (
        <div className="table-wrap">
          <div className="empty">
            <div className="eico">
              <Users size={26} />
            </div>
            <h3>No clients yet</h3>
            <p>Add your first client to get started.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <ClientTable rows={data!.data} />
          </div>
          <ClientCards rows={data!.data} />
        </>
      )}
    </div>
  );
}
