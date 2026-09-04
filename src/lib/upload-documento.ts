import type { Documento, DocumentoCategoria } from "@/lib/types";

/** Sobe um arquivo pro Drive do escritório (via /api/documentos/upload) e
 * devolve o Documento já registrado, pronto pra entrar na tela na hora
 * (Realtime confirma o mesmo dado vindo do banco pouco depois). */
export async function uploadDocumento(params: {
  file: File;
  clienteId: string;
  clienteNome: string;
  categoria: DocumentoCategoria;
  responsavelId?: string;
}): Promise<Documento> {
  const form = new FormData();
  form.append("file", params.file);
  form.append("clienteId", params.clienteId);
  form.append("clienteNome", params.clienteNome);
  form.append("categoria", params.categoria);
  if (params.responsavelId) form.append("responsavelId", params.responsavelId);

  const res = await fetch("/api/documentos/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Não foi possível enviar o arquivo.");
  return data.documento as Documento;
}
