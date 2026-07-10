import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, walletRequiredError } from "@/lib/api/profile";
import { applyJobSchema } from "@/lib/api/validation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = applyJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid application payload.", 400);
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
  if (!profileResult.profile.walletAddress) {
    return apiError(walletRequiredError().error, walletRequiredError().message, 403);
  }

  const profile = profileResult.profile;

  // 1. Verify Freelancer Role
  if (profile.activeRole !== "freelancer") {
    return apiError("forbidden", "Only freelancers can apply to jobs.", 403);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is required for applications.", 503);
  }

  // Connects are the platform's pay-per-application unit.
  if (profile.connectsBalance < 1) {
    return apiError("insufficient_connects", "You do not have enough connects to apply to this job.", 400);
  }

  const { data: job } = await supabase.from("jobs").select("id, title, client_id, status").eq("id", id).single();
  if (!job) {
    return apiError("not_found", "Job not found.", 404);
  }
  if (job.client_id === profile.id) {
    return apiError("forbidden", "Clients cannot apply to their own job.", 403);
  }
  if (job.status !== "published" && job.status !== "ai_reviewed") {
    return apiError("conflict", "This job is not open for applications.", 409);
  }

  const { data: duplicate } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", id)
    .eq("freelancer_id", profile.id)
    .maybeSingle();
  if (duplicate) {
    return apiError("conflict", "You already applied to this job.", 409);
  }

  // 4. Perform atomic operations using service_role client
  const { data: application, error: applicationError } = await supabase
    .from("job_applications")
    .insert({
      job_id: id,
      freelancer_id: profile.id,
      proposal_text: parsed.data.proposalText,
      energy_cost: 1, // backward compatibility for DB constraint
      status: "submitted"
    })
    .select("id, job_id, proposal_text, status")
    .single();

  if (applicationError || !application) {
    return apiError("conflict", "Application could not be created. You may have already applied.", 409);
  }

  // Deduct 1 connect
  const newConnectsBalance = profile.connectsBalance - 1;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ connects_balance: newConnectsBalance })
    .eq("id", profile.id);

  if (profileError) {
    console.error("Failed to deduct freelancer connects:", profileError);
  }

  // Log connect transaction
  await supabase.from("connect_transactions").insert({
    profile_id: profile.id,
    amount: -1,
    type: "spend",
    reason: `Applied to job: ${job.title}`
  });

  return apiOk({
    application,
    connectsBalance: newConnectsBalance,
    auditEvents: ["application_created", "connects_deducted"]
  }, 201);
}
