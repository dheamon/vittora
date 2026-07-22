"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Download,
  Upload,
  ClipboardCheck,
  Search,
  Moon,
  Sun,
  Plus,
  LogOut,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useClientModal } from "./ClientModalProvider";
import { useToast } from "./ToastProvider";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") ||
      "light";
    setTheme(current);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("vittora-theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };
  return { theme, toggle };
}

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAdd } = useClientModal();
  const { toast } = useToast();
  const { theme, toggle } = useTheme();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Global search drives the clients list.
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Keep the box in sync when navigating away from /clients.
    if (!pathname.startsWith("/clients")) setSearchValue(searchParams.get("search") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function onSearch(v: string) {
    setSearchValue(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (v.trim()) params.set("search", v.trim());
      router.push(`/clients${params.toString() ? `?${params}` : ""}`);
    }, 250);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="glyph" />
          <div>
            <div className="brand-name">Vittora</div>
            <div className="brand-sub">CA Practice Suite</div>
          </div>
        </div>

        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${isActive(n.href) ? "active" : ""}`}
            >
              <Icon /> {n.label}
            </Link>
          );
        })}

        <div className="nav-label">Data</div>
        <Link href="/import" className={`nav-item ${isActive("/import") ? "active" : ""}`}>
          <Upload /> Import
        </Link>
        <Link href="/export" className={`nav-item ${isActive("/export") ? "active" : ""}`}>
          <Download /> Export
        </Link>

        <div className="nav-label">Coming soon</div>
        <button
          className="nav-item"
          onClick={() =>
            toast("Module planned", "ITR & GST tracking is on the roadmap", "warn")
          }
        >
          <ClipboardCheck /> Compliance
        </button>

        <div className="sidebar-foot">
          <div className="userchip">
            <div className="avatar">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="meta">
              <div className="n">{user.name}</div>
              <div className="r">
                {user.role} · {user.firm}
              </div>
            </div>
            <button className="logout-btn" onClick={logout} title="Sign out">
              <LogOut />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="search">
            <Search />
            <input
              placeholder="Search name, PAN, phone, GST, email…"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-add" onClick={openAdd}>
            <Plus size={18} />
            <span>Add client</span>
          </button>
        </div>

        <div className="content">{children}</div>
      </div>

      <nav className="mobile-nav">
        <Link href="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
          <LayoutDashboard /> Home
        </Link>
        <Link href="/clients" className={isActive("/clients") ? "active" : ""}>
          <Users /> Clients
        </Link>
        <button onClick={openAdd}>
          <Plus /> Add
        </button>
        <Link href="/import" className={isActive("/import") ? "active" : ""}>
          <Upload /> Import
        </Link>
      </nav>
    </div>
  );
}
