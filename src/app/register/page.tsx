"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Registration failed");
    } else {
      toast.success("Account created! Please log in.");
      router.push("/login");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: "2rem",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 60%)"
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", boxShadow: "0 0 24px rgba(139,92,246,0.3)"
          }}>
            <Heart size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>
            Create your account
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.35rem", fontSize: "0.9rem" }}>
            Start your personalized health journey
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {[
              { label: "Full Name", id: "reg-name", key: "name", type: "text", icon: <User size={16} />, placeholder: "Your name" },
              { label: "Email address", id: "reg-email", key: "email", type: "email", icon: <Mail size={16} />, placeholder: "you@example.com" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>{f.icon}</span>
                  <input id={f.id} type={f.type} className="input-field" style={{ paddingLeft: "2.5rem" }}
                    placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)} required />
                </div>
              </div>
            ))}

            {["password", "confirmPassword"].map(k => (
              <div key={k}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {k === "password" ? "Password" : "Confirm Password"}
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    id={`reg-${k}`}
                    type={showPass ? "text" : "password"}
                    className="input-field"
                    style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                    placeholder="••••••••" value={(form as any)[k]} onChange={e => update(k, e.target.value)} required minLength={6}
                  />
                  {k === "confirmPassword" && (
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button id="reg-submit" type="submit" className="btn-primary" disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "0.875rem", marginTop: "0.5rem" }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</> : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>← Back to home</Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
