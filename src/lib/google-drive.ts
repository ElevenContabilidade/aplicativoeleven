import { createAdminClient } from "@/lib/supabase/admin";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const ROOT_FOLDER_NAME = "Eleven Hub — Clientes";

interface ConnectionRow {
  refresh_token: string | null;
  access_token: string | null;
  token_expiry: string | null;
  root_folder_id: string | null;
}

export class GoogleDriveNaoConectadoError extends Error {
  constructor() {
    super("O Google Drive do escritório ainda não foi conectado. Conecte em Dados do Escritório.");
  }
}

async function getConnection(): Promise<ConnectionRow> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_drive_connection")
    .select("refresh_token, access_token, token_expiry, root_folder_id")
    .eq("id", "default")
    .maybeSingle();
  if (!data?.refresh_token) throw new GoogleDriveNaoConectadoError();
  return data;
}

async function getAccessToken(): Promise<string> {
  const conn = await getConnection();
  const expiraEm = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0;
  if (conn.access_token && expiraEm - Date.now() > 60_000) return conn.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: conn.refresh_token!,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description ?? "Não foi possível renovar o acesso ao Google Drive.");

  const novoExpiry = new Date(Date.now() + json.expires_in * 1000).toISOString();
  const admin = createAdminClient();
  await admin
    .from("google_drive_connection")
    .update({ access_token: json.access_token, token_expiry: novoExpiry })
    .eq("id", "default");

  return json.access_token as string;
}

async function driveFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro na API do Google Drive (${res.status}): ${body}`);
  }
  return res.json();
}

async function encontrarPasta(nome: string, paiId?: string): Promise<string | null> {
  const q = [
    `name = '${nome.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    paiId ? `'${paiId}' in parents` : "'root' in parents",
  ].join(" and ");
  const json = await driveFetch(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  return json.files?.[0]?.id ?? null;
}

async function criarPasta(nome: string, paiId?: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      parents: paiId ? [paiId] : undefined,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível criar a pasta no Drive.");
  return json.id as string;
}

async function getRootFolderId(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("google_drive_connection").select("root_folder_id").eq("id", "default").maybeSingle();
  if (data?.root_folder_id) return data.root_folder_id;

  const existente = await encontrarPasta(ROOT_FOLDER_NAME);
  const id = existente ?? (await criarPasta(ROOT_FOLDER_NAME));
  await admin.from("google_drive_connection").update({ root_folder_id: id }).eq("id", "default");
  return id;
}

/** Acha (ou cria) a pasta do cliente dentro da pasta raiz do escritório no Drive. */
export async function ensureClienteFolder(clienteId: string, clienteNome: string): Promise<string> {
  const rootId = await getRootFolderId();
  const nomePasta = `${clienteNome} (${clienteId})`;
  const existente = await encontrarPasta(nomePasta, rootId);
  return existente ?? criarPasta(nomePasta, rootId);
}

/** Sobe o arquivo pra dentro da pasta do cliente e deixa o link aberto pra
 * "qualquer um com o link" — assim quem vê o documento no Eleven Hub
 * consegue abrir sem precisar logar com uma conta Google própria. */
export async function uploadFileToDrive(
  folderId: string,
  filename: string,
  mimeType: string,
  bytes: ArrayBuffer
): Promise<{ id: string; webViewLink: string }> {
  const token = await getAccessToken();
  const metadata = { name: filename, parents: [folderId] };
  const boundary = `eleven-hub-${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;
  const payload = new Blob([body, bytes, closing]);

  const res = await fetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: payload,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível enviar o arquivo pro Drive.");

  await fetch(`${DRIVE_API}/files/${json.id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return { id: json.id, webViewLink: json.webViewLink };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${DRIVE_API}/files/${fileId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
