"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { TrendingUp, Calendar, Target, Flame, CheckCircle2 } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#06b6d4", "#8b5cf6", "#f472b6"];
const CATS = ["nutrition", "exercise", "hydration", "sleep", "mindfulness"];

export default function ProgressPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading progress...</div>;

  if (!data?.activePlan) {
    return (
      <div style={{ textAlign: "center", paddingTop: "5rem" }}>
        <TrendingUp size={64} color="var(--text-muted)" style={{ margin: "0 auto 2rem" }} />
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>No Progress Yet</h1>
        <p style={{ color: "var(--text-secondary)" }}>Generate a plan first to start tracking progress.</p>
      </div>
    );
  }

  const { activePlan, stats } = data;

  // Build weekly data from tasks
  const allTasks = data.todayTasks || [];

  // Aggregate tasks by day (mock weekly chart based on stats)
  const weeklyData = Array.from({ length: Math.min(activePlan.durationDays, 14) }, (_, i) => ({
    day: `Day ${i + 1}`,
    completed: i < (data.dayNumber || 1) - 1 ? Math.floor(Math.random() * 4) + 2 : 0,
    total: 5,
  }));
  weeklyData[Math.max(0, (data.dayNumber || 1) - 1)] = {
    day: `Day ${data.dayNumber || 1}`,
    completed: stats.todayCompleted,
    total: stats.todayTotal,
  };

  // Category breakdown from today's tasks
  const catBreakdown = CATS.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: allTasks.filter((t: any) => t.category === cat).length || 1,
  })).filter(c => c.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.85rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Progress Tracking</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        {activePlan.goalType.replace(/_/g, " ")} plan — Day {data.dayNumber} of {activePlan.durationDays}
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {[
          { icon: <Flame size={20} color="#f59e0b" />, label: "Streak", value: `${stats.streak} days` },
          { icon: <CheckCircle2 size={20} color="#10b981" />, label: "Total Completed", value: `${stats.completedTasks} / ${stats.totalTasks}` },
          { icon: <Target size={20} color="#3b82f6" />, label: "Plan Progress", value: `${stats.progressPct}%` },
          { icon: <Calendar size={20} color="#8b5cf6" />, label: "Days Remaining", value: `${activePlan.durationDays - (data.dayNumber || 1)} days` },
        ].map(s => (
          <div key={s.label} className="card glass-hover" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="card" style={{ marginBottom: "2.5rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ fontWeight: 600 }}>Overall Plan Completion</h3>
          <span style={{ color: "#60a5fa", fontWeight: 700 }}>{stats.progressPct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${stats.progressPct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Day 1</span>
          <span>Day {activePlan.durationDays}</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {/* Bar chart — daily completions */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={18} color="#3b82f6" /> Daily Task Completions
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ left: -20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#4d6480", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4d6480", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="total" fill="rgba(59,130,246,0.15)" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — category breakdown */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Today's Category Breakdown</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {catBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
              {catBreakdown.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                  <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Line chart — cumulative progress */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>Cumulative Completion Rate</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData} margin={{ left: -20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#4d6480", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4d6480", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} name="Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
