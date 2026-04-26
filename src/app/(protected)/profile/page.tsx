"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserCircle, HeartPulse, Activity, AlertTriangle, Save, Loader2 } from "lucide-react";
import { calcBMI, calcBMR, calcTDEE, getBMICategory } from "@/lib/health";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allergies, setAllergies] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    heightCm: "", weightKg: "", age: "", gender: "Masculine",
    activityLevel: "Moderately Active", nutritionalGoal: "Weight loss",
    dietaryPreference: "Healthy recipes", chronicDisease: "",
    allergyIds: [] as string[]
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then(r => r.json()),
      fetch("/api/allergies").then(r => r.json())
    ]).then(([profRes, allRes]) => {
      if (profRes.profile) {
        setForm({
          heightCm: profRes.profile.heightCm?.toString() || "",
          weightKg: profRes.profile.weightKg?.toString() || "",
          age: profRes.profile.age?.toString() || "",
          gender: profRes.profile.gender || "Masculine",
          activityLevel: profRes.profile.activityLevel || "Moderately Active",
          nutritionalGoal: profRes.profile.nutritionalGoal || "Weight loss",
          dietaryPreference: profRes.profile.dietaryPreference || "Healthy recipes",
          chronicDisease: profRes.profile.chronicDisease || "",
          allergyIds: profRes.allergies?.map((a: any) => a.id) || []
        });
      }
      setAllergies(allRes.allergies || []);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender,
          activityLevel: form.activityLevel,
          nutritionalGoal: form.nutritionalGoal,
          dietaryPreference: form.dietaryPreference,
          chronicDisease: form.chronicDisease,
          allergyIds: form.allergyIds
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to save profile");
    }
    setSaving(false);
  }

  function toggleAllergy(id: string) {
    setForm(f => ({
      ...f,
      allergyIds: f.allergyIds.includes(id) 
        ? f.allergyIds.filter(a => a !== id)
        : [...f.allergyIds, id]
    }));
  }

  const w = parseFloat(form.weightKg);
  const h = parseFloat(form.heightCm);
  const a = parseInt(form.age);
  const bmi = w && h ? calcBMI(w, h) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;
  const bmr = w && h && a ? calcBMR(w, h, a, form.gender) : null;
  const tdee = bmr ? calcTDEE(bmr, form.activityLevel) : null;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>Profile & Health Data</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "start" }}>
        <div className="card">
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}><UserCircle size={20} color="#60a5fa" /> Basic Info</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Age</label>
                <input type="number" className="input-field" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Years" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Height (cm)</label>
                <input type="number" className="input-field" value={form.heightCm} onChange={e => setForm({...form, heightCm: e.target.value})} placeholder="cm" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Weight (kg)</label>
                <input type="number" className="input-field" value={form.weightKg} onChange={e => setForm({...form, weightKg: e.target.value})} placeholder="kg" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Gender</label>
                <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="Masculine">Male</option>
                  <option value="Feminine">Female</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Activity Level</label>
                <select className="input-field" value={form.activityLevel} onChange={e => setForm({...form, activityLevel: e.target.value})}>
                  <option value="Sedentary">Sedentary (office job)</option>
                  <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
                  <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
                  <option value="Active">Active (6-7 days/wk)</option>
                  <option value="Very Active">Very Active (physical job)</option>
                </select>
              </div>
            </div>

            <hr style={{ borderColor: "var(--border)", margin: "1rem 0" }} />
            
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}><HeartPulse size={20} color="#10b981" /> Diet & Goals</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Nutritional Goal</label>
                <select className="input-field" value={form.nutritionalGoal} onChange={e => setForm({...form, nutritionalGoal: e.target.value})}>
                  <option value="Weight loss">Weight Loss</option>
                  <option value="Muscle gain">Muscle Gain</option>
                  <option value="Energy maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Dietary Preference</label>
                <select className="input-field" value={form.dietaryPreference} onChange={e => setForm({...form, dietaryPreference: e.target.value})}>
                  <option value="Healthy recipes">Healthy</option>
                  <option value="Modern">Modern</option>
                  <option value="Traditional">Traditional</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Chronic Diseases (optional)</label>
              <input type="text" className="input-field" value={form.chronicDisease} onChange={e => setForm({...form, chronicDisease: e.target.value})} placeholder="E.g., Diabetes, Hypertension" />
            </div>

            <hr style={{ borderColor: "var(--border)", margin: "1rem 0" }} />
            
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertTriangle size={20} color="#f43f5e" /> Allergies</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Select any food allergies. AI will automatically exclude recipes containing these ingredients.</p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", maxHeight: 300, overflowY: "auto", padding: "1rem", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)" }}>
              {allergies.map(a => {
                const active = form.allergyIds.includes(a.id);
                return (
                  <div key={a.id} onClick={() => toggleAllergy(a.id)} style={{
                    padding: "0.4rem 0.75rem", borderRadius: 20, fontSize: "0.85rem", cursor: "pointer", userSelect: "none",
                    border: `1px solid ${active ? "#f43f5e" : "var(--border-light)"}`,
                    background: active ? "rgba(244,63,94,0.15)" : "var(--bg-card)",
                    color: active ? "#f43f5e" : "var(--text-secondary)",
                    transition: "all 0.2s"
                  }}>
                    {a.name}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Metrics Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>
          <div className="card glow-blue" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "1rem" }}>Body Mass Index</h3>
            {bmi ? (
              <>
                <div style={{ fontSize: "3rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{bmi}</div>
                <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: 20, background: bmiCat?.bg, color: bmiCat?.color, fontSize: "0.8rem", fontWeight: 600, marginTop: "0.75rem" }}>
                  {bmiCat?.label}
                </div>
              </>
            ) : <div style={{ color: "var(--text-muted)" }}>Enter height & weight</div>}
          </div>

          <div className="card glow-emerald" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "1rem" }}>Daily Energy Expenditure</h3>
            {tdee ? (
              <>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1, color: "#34d399" }}>{tdee}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>kcal / day to maintain weight</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  BMR: {bmr} kcal (resting)
                </div>
              </>
            ) : <div style={{ color: "var(--text-muted)" }}>Complete basic info to calculate</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
