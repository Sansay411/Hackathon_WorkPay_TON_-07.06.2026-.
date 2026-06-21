import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendBotNotification } from "@/lib/telegram/notifications";

export async function GET(request: Request) {
  const initData = new URL(request.url).searchParams.get("initData");
  if (!initData) {
    return apiError("telegram_required", "Open inside Telegram to load your deals.", 400);
  }

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  const { data, error } = await supabase
    .from("deals")
    .select(`
      id,
      title,
      description,
      price_amount,
      price_token,
      status,
      deadline,
      client_id,
      freelancer_id,
      created_at
    `)
    .or(`client_id.eq.${profileResult.profile.id},freelancer_id.eq.${profileResult.profile.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("server_error", "Failed to retrieve deals.", 500);
  }

  return apiOk({ deals: data || [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("bad_request", "Missing request body.", 400);
  }

  const { initData, title, description, price_amount, price_token, freelancer_username, deadline } = body;

  if (!title || !description || !price_amount || !price_token || !freelancer_username) {
    return apiError("bad_request", "Missing required fields.", 400);
  }

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  // Normalize username
  const cleanUsername = freelancer_username.replace(/^@/, "").trim().toLowerCase();

  // Find freelancer
  const { data: freelancer, error: freelancerError } = await supabase
    .from("profiles")
    .select("id, telegram_id, telegram_username")
    .eq("telegram_username", cleanUsername)
    .maybeSingle();

  if (freelancerError || !freelancer) {
    return apiError(
      "not_found",
      `The freelancer @${cleanUsername} is not registered on WorkPay. Ask them to join @${process.env.TELEGRAM_BOT_USERNAME || "GetWorkPayBot"} first!`,
      404
    );
  }

  if (freelancer.id === profileResult.profile.id) {
    return apiError("bad_request", "You cannot create an escrow contract with yourself.", 400);
  }

  // Insert deal
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .insert({
      client_id: profileResult.profile.id,
      freelancer_id: freelancer.id,
      title: title.trim(),
      description: description.trim(),
      price_amount: parseFloat(price_amount),
      price_token: price_token,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: "draft"
    })
    .select("id, status")
    .single();

  if (dealError || !deal) {
    return apiError("server_error", "Failed to create deal.", 500);
  }

  // Log event
  await supabase.from("deal_events").insert({
    deal_id: deal.id,
    actor_id: profileResult.profile.id,
    event_type: "deal_created",
    to_status: "draft"
  });

  // Notify freelancer
  if (freelancer.telegram_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workpay-ton-fixed.vercel.app";
    const text = `👋 You have a new escrow contract invite for "<b>${title.trim()}</b>" from Client.\n\nBudget: <b>${price_amount} ${price_token}</b>`;
    await sendBotNotification(
      freelancer.telegram_id,
      text,
      "View Contract",
      `${appUrl}/deals/${deal.id}`
    );
  }

  return apiOk({ deal: { id: deal.id, status: deal.status } }, 201);
}
