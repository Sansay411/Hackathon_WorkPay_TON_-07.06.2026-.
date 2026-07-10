import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { FreelancerProfileCard } from "@/components/mobile/FreelancerProfileCard";
import { MobileShell } from "@/components/mobile/MobileShell";
import { mapProfileRow, profileSelect } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const result = supabase
    ? await supabase.from("profiles").select(profileSelect).eq("id", id).maybeSingle()
    : { data: null, error: new Error("Supabase is not configured.") };

  if (result.error || !result.data) {
    return (
      <MobileShell>
        <div className="rounded-[30px] border border-white/75 bg-white/[0.74] p-6 text-center shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-slate-100 text-slate-400">
            <UserRound className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-[-0.03em] text-slate-950">Profile not found</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">The profile is unavailable or has not been created yet.</p>
          <Link href="/marketplace" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Link href="/marketplace" className="mb-4 inline-flex items-center gap-2 text-xs font-black text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>
      <FreelancerProfileCard profile={mapProfileRow(result.data)} />
    </MobileShell>
  );
}
