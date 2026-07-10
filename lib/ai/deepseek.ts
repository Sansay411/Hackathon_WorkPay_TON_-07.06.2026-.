import "server-only";

import { z } from "zod";

export type DeepSeekAssistMode = "profile" | "job" | "proposal";

const assistResultSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  bio: z.string().default(""),
  skills: z.array(z.string()).default([]),
  proposal: z.string().default(""),
  deliverables: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  milestones: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  riskNotes: z.array(z.string()).default([])
});

export type DeepSeekAssistResult = z.infer<typeof assistResultSchema>;

const modeInstructions: Record<DeepSeekAssistMode, string> = {
  profile:
    "Create a credible freelancer profile. Improve the bio, extract focused professional skills, and suggest concrete trust-building improvements. Never invent employers, metrics, certificates, or experience.",
  job:
    "Turn the brief into a clear freelance job posting. Return a concise title, detailed description, measurable deliverables, acceptance criteria, useful questions, milestones, and risk notes. Do not invent requirements that change the budget or scope.",
  proposal:
    "Write a tailored freelancer proposal for the supplied job. It must be specific, confident, concise, transparent about unknowns, and include a practical first step. Never invent portfolio projects, ratings, clients, or credentials."
};

function extractJson(content: string) {
  return content
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, "")
    .replace(/\s*\`\`\`$/, "");
}

export async function runDeepSeekAssist(input: {
  mode: DeepSeekAssistMode;
  prompt: string;
  context?: Record<string, unknown>;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DeepSeek is not configured.");
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are WorkPay Copilot for a Telegram freelance marketplace. " +
              modeInstructions[input.mode] +
              " Reply with one valid JSON object only. Use the same language as the user's prompt. " +
              "The JSON keys are: title, description, bio, skills, proposal, deliverables, acceptanceCriteria, milestones, questions, suggestions, riskNotes. " +
              "All list values must be arrays of short strings. Use empty strings or arrays for irrelevant keys."
          },
          {
            role: "user",
            content: JSON.stringify({
              request: input.prompt,
              context: input.context ?? {}
            })
          }
        ]
      }),
      cache: "no-store",
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message || `DeepSeek request failed with status ${response.status}.`);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned an empty response.");
    }

    const parsed = JSON.parse(extractJson(content)) as unknown;
    return {
      result: assistResultSchema.parse(parsed),
      model
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("DeepSeek request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
