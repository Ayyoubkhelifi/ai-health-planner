"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Target, Calendar, Dumbbell, Clock, Loader2 } from "lucide-react";

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    goalType: "weight_loss",
    goalDetails: "",
    durationDays: "7",
    equipment: "",
    exerciseTimeMin: "30",
    dietType: "any",
    foodLikes: "",
    foodDislikes: ""
  });

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: form.goalType,
          goalDetails: form.goalDetails,
          durationDays: parseInt(form.durationDays),
          equipment: form.equipment,
          exerciseTimeMin: parseInt(form.exerciseTimeMin),
          dietType: form.dietType,
          foodLikes: form.foodLikes,
          foodDislikes: form.foodDislikes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      toast.success("Health plan successfully generated!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem", boxShadow: "0 0 32px rgba(139,92,246,0.4)"
        }}>
          <Sparkles size={32} color="white" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Generate AI Health Plan</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Configure your goals. AI will build a personalized daily routine using real recipes tailored to your profile.</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 80, height: 80, borderRadius: "50%", border: "4px solid rgba(59,130,246,0.1)", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }} />
              <Sparkles size={32} color="#8b5cf6" className="animate-pulse" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Analyzing your profile...</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 400 }}>AI is calculating your nutritional needs, checking allergies, selecting optimal recipes, and structuring your daily routine. This may take 15-30 seconds.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}><Target size={18} color="#f59e0b" /> Primary Goal</label>
                <select className="input-field" value={form.goalType} onChange={e => setForm({...form, goalType: e.target.value})}>
                  <option value="weight_loss">Weight Loss (Caloric Deficit)</option>
                  <option value="muscle_gain">Muscle Gain (High Protein/Surplus)</option>
                  <option value="maintenance">Maintenance (Balanced)</option>
                  <option value="endurance">Endurance Training</option>
                  <option value="flexibility">Flexibility & Recovery</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}><Calendar size={18} color="#10b981" /> Plan Duration</label>
                <select className="input-field" value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})}>
                  <option value="7">1 Week (7 days)</option>
                  <option value="14">2 Weeks (14 days)</option>
                  <option value="30">1 Month (30 days)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}>Specific Details or Constraints</label>
              <textarea 
                className="input-field" rows={3} style={{ resize: "none" }}
                placeholder="E.g., I want to lose 2kg before my wedding next month. I have a knee injury so avoid high-impact cardio. I love spicy food."
                value={form.goalDetails} onChange={e => setForm({...form, goalDetails: e.target.value})}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}><Dumbbell size={18} color="#60a5fa" /> Available Equipment</label>
                <input 
                  type="text" className="input-field" 
                  placeholder="E.g., None (bodyweight), Dumbbells, Full Gym"
                  value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})}
                />
              </div>
              
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}><Clock size={18} color="#f472b6" /> Daily Exercise Time (min)</label>
                <input 
                  type="number" className="input-field" min="10" max="180"
                  value={form.exerciseTimeMin} onChange={e => setForm({...form, exerciseTimeMin: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}>Diet Type</label>
                <select className="input-field" value={form.dietType} onChange={e => setForm({...form, dietType: e.target.value})}>
                  <option value="any">Any (No specific restriction)</option>
                  <option value="vegetarian">Vegetarian (No meat/fish)</option>
                  <option value="vegan">Vegan (No animal products)</option>
                  <option value="pescatarian">Pescatarian (Fish allowed, no meat)</option>
                  <option value="keto">Keto (Very low carb)</option>
                  <option value="mediterranean">Mediterranean</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}>Foods I LOVE (Include)</label>
                <textarea 
                  className="input-field" rows={2} style={{ resize: "none" }}
                  placeholder="E.g., Chicken, Pasta, Berries"
                  value={form.foodLikes} onChange={e => setForm({...form, foodLikes: e.target.value})}
                />
              </div>
              
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontWeight: 600 }}>Foods I HATE (Avoid)</label>
                <textarea 
                  className="input-field" rows={2} style={{ resize: "none" }}
                  placeholder="E.g., Broccoli, Seafood, Olives"
                  value={form.foodDislikes} onChange={e => setForm({...form, foodDislikes: e.target.value})}
                />
              </div>
            </div>

            <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong>Note:</strong> Generating a plan will overwrite your currently active plan. Make sure your profile metrics (height, weight, allergies) are up to date before generating.
            </div>

            <button type="submit" className="btn-primary animate-pulse-glow" style={{ justifyContent: "center", padding: "1rem", fontSize: "1.1rem" }}>
              <Sparkles size={20} /> Generate AI Plan
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
