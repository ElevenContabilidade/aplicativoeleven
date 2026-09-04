import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const erroGoogle = searchParams.get("error");
  const destino = `${origin}/dados-escritorio`;

  if (erroGoogle) {
    return NextResponse.redirect(`${destino}?googleDrive=erro&msg=${encodeURIComponent(erroGoogle)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${destino}?googleDrive=erro&msg=${encodeURIComponent("Código de autorização ausente.")}`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenJson.error_description ?? "Falha ao trocar o código pelo token.");

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    const admin = createAdminClient();
    const tokenExpiry = new Date(Date.now() + tokenJson.expires_in * 1000).toISOString();
    const patch: Record<string, unknown> = {
      id: "default",
      access_token: tokenJson.access_token,
      token_expiry: tokenExpiry,
      connected_email: userInfo.email ?? null,
      connected_at: new Date().toISOString(),
    };
    // O Google só manda refresh_token na primeira autorização — se vier de
    // novo (reconexão com prompt=consent), atualiza; senão mantém o que já tinha.
    if (tokenJson.refresh_token) patch.refresh_token = tokenJson.refresh_token;

    const { error } = await admin.from("google_drive_connection").upsert(patch, { onConflict: "id" });
    if (error) throw new Error(error.message);

    return NextResponse.redirect(`${destino}?googleDrive=conectado`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.redirect(`${destino}?googleDrive=erro&msg=${encodeURIComponent(msg)}`);
  }
}
