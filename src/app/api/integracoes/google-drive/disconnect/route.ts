import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_drive_connection")
    .select("refresh_token")
    .eq("id", "default")
    .maybeSingle();

  if (data?.refresh_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token)}`, {
      method: "POST",
    }).catch(() => undefined);
  }

  const { error } = await admin
    .from("google_drive_connection")
    .update({ refresh_token: null, access_token: null, token_expiry: null, connected_email: null, connected_at: null })
    .eq("id", "default");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
