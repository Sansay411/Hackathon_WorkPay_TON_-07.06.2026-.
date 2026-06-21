import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "telegram_required"
  | "wallet_required"
  | "freelancer_wallet_missing"
  | "insufficient_connects"
  | "setup_required"
  | "payment_setup_required"
  | "server_error";

export function apiError(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
