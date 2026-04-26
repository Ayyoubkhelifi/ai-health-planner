"use client";

import { useState, useEffect } from "react";
import { Search, Utensils, X, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [allergyFilter, setAllergyFilter] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);

  const categories = ["All", "Main Dish", "Soup", "Salad", "Dessert", "Drink", "Sandwich", "Pasta", "Rice", "Bread", "Breakfast", "Stew", "General"];

  async function fetchRecipes() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      if (category && category !== "All") q.append("category", category);
      if (allergyFilter) q.append("allergyFilter", "true");

      const res = await fetch(`/api/recipes?${q.toString()}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => fetchRecipes(), 300);
    return () => clearTimeout(timer);
  }, [search, category, allergyFilter]);

  function openRecipe(recipe: any) {
    setSelectedRecipe(recipe);
    setInstructions(null); // Reset instructions when opening a new recipe
  }

  function closeRecipe() {
    setSelectedRecipe(null);
    setInstructions(null);
  }

  async function generateInstructions(recipeId: string) {
    setGeneratingInstructions(true);
    try {
      const res = await fetch("/api/recipes/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setInstructions(data.instructions);
      } else {
        setInstructions("⚠️ Failed to generate instructions. Please try again.");
      }
    } catch (e) {
      setInstructions("⚠️ Failed to generate instructions. Please try again.");
    }
    setGeneratingInstructions(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "2rem", fontWeight: 700 }}>Recipe Library</h1>
          <p style={{ color: "var(--text-secondary)" }}>Browse {recipes.length > 0 ? recipes.length : "our"} healthy recipes.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card glass-hover" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", padding: "1rem" }}>
        <div style={{ flex: "1 1 250px", position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text" className="input-field" style={{ paddingLeft: "2.5rem" }}
            placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: "0 1 200px" }}>
          <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={() => setAllergyFilter(!allergyFilter)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1.25rem", borderRadius: 10,
            background: allergyFilter ? "rgba(16,185,129,0.15)" : "var(--bg-card)",
            border: `1px solid ${allergyFilter ? "rgba(16,185,129,0.5)" : "var(--border)"}`,
            color: allergyFilter ? "#34d399" : "var(--text-secondary)",
            cursor: "pointer", fontWeight: 500, transition: "all 0.2s"
          }}
        >
          <ShieldCheck size={18} /> Safe for my allergies
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <Utensils size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
          No recipes found matching your filters.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {recipes.map(r => (
            <div key={r.id} className="card glass-hover" onClick={() => openRecipe(r)} style={{ cursor: "pointer", padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 140, background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Utensils size={40} color="rgba(255,255,255,0.1)" />
              </div>
              <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>{r.category || "General"}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", lineHeight: 1.4 }}>{r.name}</h3>

                <div style={{ marginTop: "auto", fontSize: "0.85rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.recipeIngredients.slice(0, 5).map((ri: any) => ri.ingredient.name).join(", ")}
                  {r.recipeIngredients.length > 5 ? "..." : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedRecipe && (
        <div
          onClick={closeRecipe}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card animate-fade-in" style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button onClick={closeRecipe} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={24} /></button>

            <div style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.5rem" }}>{selectedRecipe.category}</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>{selectedRecipe.name}</h2>
            {selectedRecipe.nameAr && <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "1.1rem", direction: "rtl" }}>{selectedRecipe.nameAr}</div>}

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <Utensils size={18} color="#10b981" /> Ingredients ({selectedRecipe.recipeIngredients.length})
            </h3>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedRecipe.recipeIngredients.map((ri: any) => (
                <li key={ri.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
                  {ri.ingredient.name}
                </li>
              ))}
            </ul>

            {/* AI Instructions Section */}
            <div style={{ marginTop: "2rem" }}>
              {!instructions && !generatingInstructions && (
                <button
                  onClick={() => generateInstructions(selectedRecipe.id)}
                  style={{
                    width: "100%", padding: "1rem", borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))",
                    border: "1px solid rgba(139,92,246,0.3)",
                    color: "#a78bfa", cursor: "pointer", fontWeight: 600,
                    fontSize: "0.95rem",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.25))")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))")}
                >
                  <Sparkles size={18} /> Generate AI Cooking Instructions
                </button>
              )}

              {generatingInstructions && (
                <div style={{
                  padding: "2rem", textAlign: "center",
                  background: "rgba(139,92,246,0.05)", borderRadius: 12,
                  border: "1px solid rgba(139,92,246,0.2)",
                }}>
                  <Loader2 size={24} color="#a78bfa" style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.75rem" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    AI is writing cooking instructions...
                  </p>
                </div>
              )}

              {instructions && (
                <div style={{
                  padding: "1.25rem", borderRadius: 12,
                  background: "rgba(139,92,246,0.05)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}>
                  <h3 style={{
                    fontSize: "1rem", fontWeight: 600, marginBottom: "1rem",
                    display: "flex", alignItems: "center", gap: "0.5rem", color: "#a78bfa",
                  }}>
                    <Sparkles size={16} /> AI Cooking Instructions
                  </h3>
                  <div style={{
                    fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}>
                    {instructions}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
