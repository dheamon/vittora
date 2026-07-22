"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type {
  ClientListResponse,
  SortDir,
  SortKey,
  TypeFilter,
} from "@/lib/types";
import { CLIENTS_CHANGED_EVENT } from "./ClientModalProvider";
import ClientTable from "./ClientTable";
import ClientCards from "./ClientCards";
import TableSkeleton from "./TableSkeleton";

export default function ClientsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const filter = (searchParams.get("filter") ?? "all") as TypeFilter;
  const sortKey = (searchParams.get("sortKey") ?? "name") as SortKey;
  const sortDir = (searchParams.get("sortDir") ?? "asc") as SortDir;
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;

  const [data, setData] = useState<ClientListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      filter,
      sortKey,
      sortDir,
      page: String(page),
      perPage: "10",
    });
    try {
      const res = await fetch(`/api/clients?${params}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, filter, sortKey, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener(CLIENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CLIENTS_CHANGED_EVENT, handler);
  }, [load]);

  function updateParams(next: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "" || (k === "filter" && v === "all")) params.delete(k);
      else params.set(k, v);
    }
    if (resetPage) params.delete("page");
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function onSort(key: SortKey) {
    const dir: SortDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sortKey: key, sortDir: dir }, false);
  }

  function clearSearch() {
    router.replace(pathname);
  }

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = data?.stats;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h2>Clients</h2>
          <div className="sub">
            {stats
              ? `${stats.total} total · ${stats.companies} companies · ${stats.individuals} individuals`
              : " "}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          {(["all", "individual", "company"] as TypeFilter[]).map((f) => (
            <button
              key={f}
              className={filter === f ? "on" : ""}
              onClick={() => updateParams({ filter: f })}
            >
              {f === "all" ? "All" : f === "individual" ? "Individual" : "Company"}
            </button>
          ))}
        </div>
        <div className="select-wrap">
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":");
              updateParams({ sortKey: k, sortDir: d }, false);
            }}
          >
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
            <option value="pan:asc">PAN (A–Z)</option>
            <option value="createdAt:desc">Date created (newest)</option>
            <option value="updatedAt:desc">Recently updated</option>
          </select>
        </div>
        <div className="spacer" />
        <span className="count-pill">
          {total} result{total !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="table-wrap">
          <TableSkeleton />
        </div>
      ) : total === 0 ? (
        <div className="table-wrap">
          <div className="empty">
            <div className="eico">
              <Search size={26} />
            </div>
            <h3>No clients match</h3>
            <p>Try a different search term or clear the filter.</p>
            <button
              className="btn btn-primary"
              style={{ padding: "10px 18px" }}
              onClick={clearSearch}
            >
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <ClientTable
              rows={data!.data}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <div className="pager">
              <span className="info">
                Showing {(page - 1) * data!.perPage + 1}–
                {Math.min(page * data!.perPage, total)} of {total}
              </span>
              <div className="pages">
                <button
                  className="pg"
                  disabled={page === 1}
                  onClick={() => updateParams({ page: String(page - 1) }, false)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`pg ${p === page ? "on" : ""}`}
                    onClick={() => updateParams({ page: String(p) }, false)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pg"
                  disabled={page === totalPages}
                  onClick={() => updateParams({ page: String(page + 1) }, false)}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <ClientCards rows={data!.data} />
        </>
      )}
    </div>
  );
}
