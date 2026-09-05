import { NextResponse } from "next/server";

/** Manda o navegador pra tela de consentimento do Google. access_type=offline
 * + prompt=consent garante que a gente ganhe um refresh_token (senão o
 * Google só devolve isso na primeiríssima autorização). */
export async function GET() {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!process.env.GOOGLE_CLIENT_ID || !redirectUri) {
    return NextResponse.json({ ok: false, error: "Integração com Google Drive ainda não configurada no servidor." }, { status: 500 });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  // "drive.file" só deixa o app enxergar arquivos que ele mesmo criou —
  // mesmo compartilhando uma pasta manualmente com a conta conectada,
  // arquivos colocados ali por fora do app continuam invisíveis pra API.
  // Precisa do escopo "drive" completo pra sincronizar de verdade nos
  // dois sentidos com pastas organizadas manualmente no Drive.
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email"
  );

  return NextResponse.redirect(url.toString());
}
