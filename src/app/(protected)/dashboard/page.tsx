"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Flame, Target, Trophy, Clock, CheckCircle2, Circle, Utensils, Activity, Droplets, Moon, Brain, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");

  const fetchDash = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDash(); }, [fetchDash]);

  async function toggleTask(taskId: string, currentCompleted: boolean) {
    // Prevent double-clicks
    if (togglingIds.has(taskId)) return;

    // Optimistic update: immediately flip the UI
    setTogglingIds((prev) => new Set(prev).add(taskId));
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        todayTasks: prev.todayTasks.map((t: any) =>
          t.id === taskId ? { ...t, completed: !currentCompleted } : t
        ),
        stats: {
          ...prev.stats,
          todayCompleted: prev.stats.todayCompleted + (currentCompleted ? -1 : 1),
        },
      };
    });

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: !currentCompleted }),
      });
      if (!res.ok) throw new Error("Failed");
      // Refetch to sync everything (streak, progress, etc.)
      await fetchDash();
    } catch (e) {
      toast.error("Failed to update task");
      // Revert optimistic update
      await fetchDash();
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  async function cancelPlan() {
    if (!confirm("Are you sure you want to cancel and delete your current plan?")) return;
    try {
      const res = await fetch(`/api/plan?planId=${data.activePlan.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Plan cancelled successfully");
        setData(null);
        router.refresh();
      } else throw new Error("Failed to cancel plan");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function regenerateDay() {
    if (!data?.activePlan?.id) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/plan/regenerate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: data.activePlan.id,
          dayNumber: data.dayNumber,
          userPrompt: regenPrompt
        })
      });
      if (res.ok) {
        toast.success("Day regenerated successfully!");
        setRegenPrompt("");
        await fetchDash();
      } else {
        toast.error("Failed to regenerate day");
      }
    } catch (e: any) {
      toast.error("Error regenerating day");
    }
    setRegenerating(false);
  }

  if (loading) return <div className="animate-pulse" style={{ height: "100vh", padding: "2rem" }}>Loading dashboard...</div>;

  if (!data || !data.activePlan) {
    return (
      <div style={{ textAlign: "center", paddingTop: "5rem" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: "rgba(59,130,246,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem"
        }}>
          <Target size={40} color="#60a5fa" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>No Active Plan</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You don&apos;t have an active health plan right now.</p>
        <Link href="/plan">
          <button className="btn-primary animate-pulse-glow" style={{ padding: "1rem 2rem" }}>Generate Your First Plan</button>
        </Link>
      </div>
    );
  }

  const { activePlan, todayTasks, stats, dayNumber } = data;

  const catColors: Record<string, string> = {
    nutrition: "#f59e0b",
    exercise: "#3b82f6",
    hydration: "#06b6d4",
    sleep: "#8b5cf6",
    mindfulness: "#f472b6",
  };

  function getIcon(cat: string) {
    switch (cat) {
      case "nutrition": return <Utensils size={16} />;
      case "exercise": return <Activity size={16} />;
      case "hydration": return <Droplets size={16} />;
      case "sleep": return <Moon size={16} />;
      case "mindfulness": return <Brain size={16} />;
      default: return <Target size={16} />;
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700 }}>Overview</h1>
          <p style={{ color: "var(--text-secondary)" }}>Day {dayNumber} of {activePlan.durationDays} • {activePlan.goalType.replace(/_/g, " ")}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Daily Target</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ fontWeight: 700, color: "#f59e0b" }}>{activePlan.dailyCalorieTarget} kcal</span>
              <span style={{ fontWeight: 700, color: "#34d399" }}>{activePlan.dailyProteinTarget}g protein</span>
            </div>
          </div>
          <button onClick={cancelPlan} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.2)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}>
            <Trash2 size={16} /> Cancel Plan
          </button>
        </div>
      </div>

      {/* Plan summary */}
      {activePlan.planSummary && (
        <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem", borderLeft: "3px solid #3b82f6" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{activePlan.planSummary}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="card glass-hover">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
            <Flame size={20} color="#f59e0b" /> Streak
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.streak} <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>days</span></div>
        </div>
        <div className="card glass-hover">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
            <Target size={20} color="#3b82f6" /> Today&apos;s Tasks
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.todayCompleted} <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>/ {stats.todayTotal}</span></div>
        </div>
        <div className="card glass-hover">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
            <Trophy size={20} color="#10b981" /> Plan Progress
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.progressPct}%</div>
          <div className="progress-bar" style={{ marginTop: "1rem" }}>
            <div className="progress-fill" style={{ width: `${stats.progressPct}%` }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>Today&apos;s Plan</h2>
        
        <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "450px" }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Change today's food (e.g. 'I want fish today')" 
            value={regenPrompt} 
            onChange={(e) => setRegenPrompt(e.target.value)}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          />
          <button 
            onClick={regenerateDay} 
            disabled={regenerating}
            style={{ 
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white", border: "none", 
              padding: "0 1rem", borderRadius: "8px", cursor: regenerating ? "not-allowed" : "pointer", 
              display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600,
              whiteSpace: "nowrap", opacity: regenerating ? 0.7 : 1
            }}
          >
            <RefreshCw size={16} className={regenerating ? "animate-spin" : ""} /> 
            {regenerating ? "Regenerating..." : "Regenerate Day"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {todayTasks.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No tasks for today.</div>
        ) : (
          todayTasks.map((t: any) => (
            <div
              key={t.id}
              className="card glass-hover"
              style={{
                display: "flex", alignItems: "flex-start", gap: "1.25rem",
                padding: "1.25rem 1.5rem",
                opacity: t.completed ? 0.6 : 1,
                transition: "all 0.3s",
                borderLeft: `3px solid ${catColors[t.category] || "var(--border)"}`,
              }}
            >
              {/* Checkbox — isolated click handler with stopPropagation */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleTask(t.id, t.completed);
                }}
                disabled={togglingIds.has(t.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: t.completed ? "#10b981" : "var(--border-light)",
                  padding: "4px", marginTop: "2px", flexShrink: 0,
                  opacity: togglingIds.has(t.id) ? 0.4 : 1,
                }}
              >
                {t.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase",
                      padding: "0.2rem 0.6rem", borderRadius: 6,
                      background: `${catColors[t.category] || "#666"}22`,
                      color: catColors[t.category] || "#999",
                    }}
                  >
                    {getIcon(t.category)} {t.category}
                  </span>
                  {t.caloriesKcal && (
                    <span style={{ fontSize: "0.8rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Flame size={12} /> {t.caloriesKcal} kcal
                    </span>
                  )}
                  {t.durationMin && (
                    <span style={{ fontSize: "0.8rem", color: "#60a5fa", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Clock size={12} /> {t.durationMin} min
                    </span>
                  )}
                </div>
                <h3 style={{
                  fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.35rem",
                  color: t.completed ? "var(--text-secondary)" : "var(--text-primary)",
                  textDecoration: t.completed ? "line-through" : "none",
                }}>
                  {t.title}
                </h3>
                {t.description && (
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {t.description}
                  </p>
                )}

                {t.recipeId && t.recipe && (
                  <div style={{
                    marginTop: "0.75rem", padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.03)", borderRadius: 8,
                    border: "1px solid var(--border)", display: "inline-flex",
                    alignItems: "center", gap: "0.5rem",
                  }}>
                    <Utensils size={14} color="#60a5fa" />
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{t.recipe.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
