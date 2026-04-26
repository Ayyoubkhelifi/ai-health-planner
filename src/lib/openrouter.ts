const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateHealthPlan(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "AI Health Planner",
    },
    body: JSON.stringify({
      model: "inclusionai/ling-2.6-1t:free",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an elite certified nutritionist, personal trainer, and wellness coach with 15 years of experience. You create highly personalized, detailed health plans that feel custom-made for each client. You use ONLY the recipes provided — never invent new ones. Your exercise prescriptions include specific sets, reps, and form cues. Your meal plans include portion sizes and macro breakdowns. You always respond with valid JSON only — no markdown code blocks, no backticks, no extra text before or after the JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OpenRouter API error:", response.status, errorBody);
    throw new Error(`OpenRouter API returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content;
}
