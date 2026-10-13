import type { Documento, DocumentoCategoria } from "@/lib/types";
import { subirArquivoEmPedacos } from "@/lib/drive-chunk-upload";
import { formatBytes } from "@/lib/utils";

/** Sobe um arquivo pro Drive do escritório (via /api/documentos/upload, em
 * pedaços) e devolve o Documento já registrado, pronto pra entrar na tela
 * na hora (Realtime confirma o mesmo dado vindo do banco pouco depois). */
export async function uploadDocumento(params: {
  file: File;
  clienteId: string;
  clienteNome: string;
  categoria: DocumentoCategoria;
  responsavelId?: string;
}): Promise<Documento> {
  const iniciar = await fetch("/api/documentos/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      categoria: params.categoria,
      filename: params.file.name,
      mimeType: params.file.type || "application/octet-stream",
    }),
  });
  const iniciarData = await iniciar.json();
  if (!iniciarData.ok) throw new Error(iniciarData.error ?? "Não foi possível enviar o arquivo.");

  const arquivo = await subirArquivoEmPedacos(iniciarData.uploadUrl, params.file);

  const finalizar = await fetch("/api/documentos/upload/finalizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clienteId: params.clienteId,
      nome: params.file.name,
      categoria: params.categoria,
      responsavelId: params.responsavelId,
      tamanho: formatBytes(params.file.size),
      driveFileId: arquivo.id,
      driveLink: arquivo.webViewLink,
    }),
  });
  const data = await finalizar.json();
  if (!data.ok) throw new Error(data.error ?? "Não foi possível registrar o arquivo.");
  return data.documento as Documento;
}
