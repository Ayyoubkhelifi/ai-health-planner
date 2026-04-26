"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email, password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: "2rem",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 60%)"
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", boxShadow: "0 0 24px rgba(59,130,246,0.3)"
          }}>
            <Heart size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.35rem", fontSize: "0.9rem" }}>
            Sign in to your health planner
          </p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  className="input-field"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                    display: "flex", alignItems: "center"
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "0.875rem" }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}>
              Create one
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Back to home
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
