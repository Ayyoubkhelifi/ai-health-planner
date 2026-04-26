"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, Target, BookOpen, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/plan", label: "Generate Plan", icon: <Target size={20} /> },
    { href: "/recipes", label: "Recipes", icon: <BookOpen size={20} /> },
    { href: "/progress", label: "Progress", icon: <TrendingUp size={20} /> },
    { href: "/profile", label: "Profile", icon: <UserCircle size={20} /> },
  ];

  return (
    <aside style={{
      width: 260, height: "100vh", position: "fixed", left: 0, top: 0,
      background: "var(--bg-card)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "1.5rem"
    }}>
      <div style={{ marginBottom: "2.5rem", padding: "0 0.5rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.4rem", fontWeight: 800, background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          HealthPlanner
        </h2>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`sidebar-link ${pathname === l.href ? "active" : ""}`}>
            {l.icon} {l.label}
          </Link>
        ))}
      </nav>

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidebar-link" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--rose)", width: "100%", justifyContent: "flex-start", marginTop: "auto" }}>
        <LogOut size={20} /> Sign Out
      </button>
    </aside>
  );
}
