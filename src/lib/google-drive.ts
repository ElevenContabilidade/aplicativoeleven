import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentoCategoria } from "@/lib/types";
import { PASTAS_DRIVE, PASTA_POR_CATEGORIA, CATEGORIA_POR_PASTA, type PastaDrive } from "@/lib/documento-pastas";

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

/** Sempre inclui suporte a Drives Compartilhados — sem isso a API do Drive
 * simplesmente não enxerga (nem lista, nem acha) nada que esteja dentro de
 * um Drive Compartilhado, o que é comum em contas Google Workspace de
 * empresa como a da Eleven. */
const SUPPORT_SHARED_DRIVES = "supportsAllDrives=true&includeItemsFromAllDrives=true";

async function encontrarPasta(nome: string, paiId?: string): Promise<string | null> {
  const q = [
    `name = '${nome.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    paiId ? `'${paiId}' in parents` : "'root' in parents",
  ].join(" and ");
  const json = await driveFetch(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&${SUPPORT_SHARED_DRIVES}`);
  return json.files?.[0]?.id ?? null;
}

async function criarPasta(nome: string, paiId?: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${DRIVE_API}/files?supportsAllDrives=true`, {
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

function extrairFolderIdDoLink(link?: string | null): string | null {
  if (!link) return null;
  const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/) ?? link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

/** Busca o link de Drive que a Kauane cadastrou manualmente pra esse cliente
 * (campo "Link do Drive" no cadastro) — quando existe, é a pasta real que
 * ela já usa há anos, e é nela que devemos ler/escrever, não numa pasta
 * nova criada pelo sistema. */
export async function getClienteLinkDrive(clienteId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("dados_financeiros").select("data").eq("tipo", "clients").eq("id", clienteId).maybeSingle();
  const linkDrive = (data?.data as { dados?: { linkDrive?: string } } | null)?.dados?.linkDrive;
  return linkDrive ?? null;
}

/** Acha (ou cria) a pasta do cliente. Se a Kauane já linkou a pasta real dela
 * no cadastro do cliente (campo "Link do Drive"), usa essa pasta direto;
 * senão cai no comportamento antigo, criando dentro da pasta raiz do
 * escritório no Drive. */
export async function ensureClienteFolder(clienteId: string, clienteNome: string, linkDriveExistente?: string | null): Promise<string> {
  const idDoLink = extrairFolderIdDoLink(linkDriveExistente);
  if (idDoLink) return idDoLink;

  const rootId = await getRootFolderId();
  const nomePasta = `${clienteNome} (${clienteId})`;
  const existente = await encontrarPasta(nomePasta, rootId);
  return existente ?? criarPasta(nomePasta, rootId);
}

/** Acha (ou cria) a pasta do cliente e, dentro dela, a subpasta certa pra
 * essa categoria de documento (Licenças, Setor Fiscal, Docs Sócio etc.) —
 * a mesma organização que já era feita manualmente no Drive. */
export async function ensureCategoriaFolder(
  clienteId: string,
  clienteNome: string,
  categoria: DocumentoCategoria,
  linkDriveExistente?: string | null
): Promise<string> {
  const clienteFolderId = await ensureClienteFolder(clienteId, clienteNome, linkDriveExistente);
  const nomeSubpasta = PASTA_POR_CATEGORIA[categoria];
  const existente = await encontrarPasta(nomeSubpasta, clienteFolderId);
  return existente ?? criarPasta(nomeSubpasta, clienteFolderId);
}

/** Garante que a pasta do cliente e todas as subpastas por setor (as mesmas
 * que a Kauane já usa manualmente) existam no Drive, mesmo sem nenhum
 * documento ter sido enviado ainda pelo sistema. Assim dá pra jogar um
 * arquivo direto lá que o sistema já sabe em qual pasta ele deveria estar. */
export async function ensureAllCategoriaFolders(
  clienteId: string,
  clienteNome: string,
  linkDriveExistente?: string | null
): Promise<{ clienteFolderId: string; pastas: Record<PastaDrive, string> }> {
  const clienteFolderId = await ensureClienteFolder(clienteId, clienteNome, linkDriveExistente);
  const pastas = {} as Record<PastaDrive, string>;
  for (const nome of PASTAS_DRIVE) {
    const existente = await encontrarPasta(nome, clienteFolderId);
    pastas[nome] = existente ?? (await criarPasta(nome, clienteFolderId));
  }
  return { clienteFolderId, pastas };
}

interface DriveFileInfo {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  webViewLink: string;
}

async function listarArquivosNaPasta(folderId: string): Promise<DriveFileInfo[]> {
  const q = [`'${folderId}' in parents`, "trashed = false", "mimeType != 'application/vnd.google-apps.folder'"].join(" and ");
  const json = await driveFetch(
    `/files?q=${encodeURIComponent(q)}&fields=files(id,name,size,createdTime,webViewLink)&pageSize=200&${SUPPORT_SHARED_DRIVES}`
  );
  return json.files ?? [];
}

/** Varre as subpastas do cliente no Drive (criando as que faltarem) e
 * devolve todo arquivo encontrado, junto da categoria que a pasta indica e
 * um resumo por pasta (id + quantos arquivos achou) pra dar pra
 * diagnosticar quando algo não aparece como esperado. */
export async function listarArquivosClienteDrive(
  clienteId: string,
  clienteNome: string,
  linkDriveExistente?: string | null
): Promise<{
  clienteFolderId: string;
  arquivos: Array<{ file: DriveFileInfo; categoria: DocumentoCategoria }>;
  resumoPastas: Array<{ nome: string; folderId: string; totalArquivos: number }>;
}> {
  const { clienteFolderId, pastas } = await ensureAllCategoriaFolders(clienteId, clienteNome, linkDriveExistente);
  const arquivos: Array<{ file: DriveFileInfo; categoria: DocumentoCategoria }> = [];
  const resumoPastas: Array<{ nome: string; folderId: string; totalArquivos: number }> = [];
  for (const [nomePasta, folderId] of Object.entries(pastas)) {
    const arquivosDaPasta = await listarArquivosNaPasta(folderId);
    const categoria = CATEGORIA_POR_PASTA[nomePasta as PastaDrive] ?? "Outros";
    for (const file of arquivosDaPasta) arquivos.push({ file, categoria });
    resumoPastas.push({ nome: nomePasta, folderId, totalArquivos: arquivosDaPasta.length });
  }

  // Também varre a raiz da pasta do cliente — se o arquivo foi jogado direto
  // ali (fora de qualquer subpasta de setor), ainda assim precisa aparecer.
  const arquivosNaRaiz = await listarArquivosNaPasta(clienteFolderId);
  for (const file of arquivosNaRaiz) arquivos.push({ file, categoria: "Outros" });
  resumoPastas.push({ nome: "(raiz da pasta do cliente)", folderId: clienteFolderId, totalArquivos: arquivosNaRaiz.length });

  return { clienteFolderId, arquivos, resumoPastas };
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

  const res = await fetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: payload,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível enviar o arquivo pro Drive.");

  await fetch(`${DRIVE_API}/files/${json.id}/permissions?supportsAllDrives=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return { id: json.id, webViewLink: json.webViewLink };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${DRIVE_API}/files/${fileId}?supportsAllDrives=true`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
