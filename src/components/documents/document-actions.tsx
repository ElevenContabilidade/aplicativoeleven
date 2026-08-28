"use client";

import { Eye, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import type { Documento } from "@/lib/types";

export function DocumentActions({ documento }: { documento: Documento }) {
  const deleteDocumento = useAppStore((s) => s.deleteDocumento);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Excluir "${documento.nome}"? Essa ação não pode ser desfeita.`)) {
      deleteDocumento(documento.id);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {documento.url ? (
        <a
          href={documento.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Visualizar / baixar"
          className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
        >
          <Eye className="size-3.5" />
        </a>
      ) : (
        <span title="Arquivo indisponível nesta sessão" className="flex size-7 items-center justify-center text-sand-200">
          <Eye className="size-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        title="Excluir"
        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
