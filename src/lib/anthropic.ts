import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default client;

export async function generateHealthPlan(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system:
      "You are a certified nutritionist and fitness coach. You create personalized health plans using ONLY the recipes provided to you. Never invent recipes. Respond ONLY with valid JSON, no markdown code blocks, no extra text.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text;
}
