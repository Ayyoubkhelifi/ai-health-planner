"use client";
import { Sidebar } from "@/components/Sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, padding: "2rem", overflowY: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
