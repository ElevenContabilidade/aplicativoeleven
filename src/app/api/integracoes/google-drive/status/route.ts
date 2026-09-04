import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_drive_connection")
    .select("connected_email, connected_at, refresh_token")
    .eq("id", "default")
    .maybeSingle();

  return NextResponse.json({
    connected: Boolean(data?.refresh_token),
    email: data?.connected_email ?? null,
    connectedAt: data?.connected_at ?? null,
  });
}
