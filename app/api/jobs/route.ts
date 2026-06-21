import { apiError, apiOk } from "@/lib/api/errors";
import { jobSelect, legacyJobSelect, mapJobRow } from "@/lib/api/jobs";
import { jobCreateSchema } from "@/lib/api/validation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getVerifiedProfile } from "@/lib/api/profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const my = url.searchParams.get("my") === "true";
  const initData = url.searchParams.get("initData");

  const supabase = createSupabaseServiceRoleClient();
  if (supabase) {
    let query = supabase.from("jobs").select(jobSelect);

    if (my && initData) {
      const profileResult = await getVerifiedProfile(initData);
      if (profileResult.status === "ready") {
        query = query.eq("client_id", profileResult.profile.id);
      } else {
        return apiError("unauthorized", "Authentication failed.", 401);
      }
    }

    const result = await query.order("created_at", { ascending: false });
    let data: Record<string, unknown>[] | null = result.data;
    let error = result.error;
    if (error?.message.includes("deliverables") || error?.message.includes("acceptance_criteria")) {
      let legacyQuery = supabase.from("jobs").select(legacyJobSelect);
      if (my && initData) {
        const profileResult = await getVerifiedProfile(initData);
        if (profileResult.status === "ready") {
          legacyQuery = legacyQuery.eq("client_id", profileResult.profile.id);
        }
      }
      const legacy = await legacyQuery.order("created_at", { ascending: false });
      data = legacy.data;
      error = legacy.error;
    }
    if (!error && data) {
      return apiOk({ jobs: data.map((row) => mapJobRow(row)) });
    }
  }
  return apiOk({ jobs: [] });
}

export async function POST(request: Request) {
  const parsed = jobCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid job payload.", 400);
  }

  const { initData, title, description, category, budgetAmount, budgetToken, deadline } = parsed.data;

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status === "telegram_required") {
    return apiError("telegram_required", profileResult.message, 400);
  }
  if (profileResult.status === "setup_required") {
    return apiError("setup_required", profileResult.message, 503);
  }
  if (profileResult.status === "unauthorized") {
    return apiError("unauthorized", profileResult.message, 401);
  }

  const profile = profileResult.profile;

  // 1. Verify Client Role
  if (profile.activeRole !== "client") {
    return apiError("forbidden", "Only clients can create new job postings.", 403);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  // 2. Count Active Jobs for this Client
  const { data: activeJobs, error: countError } = await supabase
    .from("jobs")
    .select("id")
    .eq("client_id", profile.id)
    .in("status", ["draft", "published", "ai_reviewed"]);

  if (countError) {
    return apiError("server_error", "Failed to check existing jobs limit.", 500);
  }

  const activeCount = activeJobs?.length || 0;
  const hasSubscription = profile.subscriptionUntil && new Date(profile.subscriptionUntil) > new Date();

  // 3. Enforce Limit: Max 3 active jobs without subscription
  if (activeCount >= 3 && !hasSubscription) {
    return apiError(
      "forbidden",
      "You have reached the limit of 3 active job postings. Upgrade to a paid plan to publish more projects.",
      403
    );
  }

  // 4. Save Job to DB
  const { data: job, error: insertError } = await supabase
    .from("jobs")
    .insert({
      client_id: profile.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      budget_amount: parseFloat(budgetAmount),
      budget_token: budgetToken,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: "published"
    })
    .select()
    .single();

  if (insertError || !job) {
    return apiError("server_error", "Failed to create job posting in database.", 500);
  }

  return apiOk({ job, auditEvent: "job_created" }, 201);
}
