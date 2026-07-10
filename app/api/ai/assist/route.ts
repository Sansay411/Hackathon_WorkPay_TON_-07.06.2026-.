import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { runDeepSeekAssist } from "@/lib/ai/deepseek";

const assistSchema = z.object({
  initData: z.string().min(1),
  mode: z.enum(["profile", "job", "proposal"]),
  prompt: z.string().trim().min(4).max(6000),
  context: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  const parsed = assistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid AI assistant request.", 400);
  }

  const profileResult = await getVerifiedProfile(parsed.data.initData);
  if (profileResult.status === "telegram_required") {
    return apiError("telegram_required", profileResult.message, 400);
  }
  if (profileResult.status === "setup_required") {
    return apiError("setup_required", profileResult.message, 503);
  }
  if (profileResult.status === "unauthorized") {
    return apiError("unauthorized", profileResult.message, 401);
  }

  try {
    const response = await runDeepSeekAssist({
      mode: parsed.data.mode,
      prompt: parsed.data.prompt,
      context: {
        ...parsed.data.context,
        workPayProfile: {
          role: profileResult.profile.activeRole,
          bio: profileResult.profile.bio,
          skills: profileResult.profile.skills,
          hourlyRate: profileResult.profile.hourlyRate
        }
      }
    });
    return apiOk(response);
  } catch (error) {
    console.error("DeepSeek assistant failed:", error instanceof Error ? error.message : error);
    const message =
      error instanceof Error && error.message === "DeepSeek is not configured."
        ? error.message
        : "AI assistant is temporarily unavailable. Your draft was not changed.";
    return apiError("server_error", message, 503);
  }
}
