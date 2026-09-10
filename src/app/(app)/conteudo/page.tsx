"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PostKanbanBoard } from "@/components/conteudo/post-kanban-board";
import { PostFormDialog } from "@/components/conteudo/post-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { ConteudoPost } from "@/lib/types";

export default function ConteudoPage() {
  const posts = useAppStore((s) => s.conteudoPosts);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ConteudoPost | null>(null);
  // Contador que muda a cada abertura, forçando o PostFormDialog a remontar
  // — senão reabrir o MESMO post logo após editá-lo reaproveita a instância
  // que o dialog já tinha zerado ao fechar (mesmo bug já visto no Scripts).
  const [formOpenKey, setFormOpenKey] = useState(0);

  function openNovo() {
    setEditingPost(null);
    setFormOpenKey((k) => k + 1);
    setFormOpen(true);
  }
  function openEdit(post: ConteudoPost) {
    setEditingPost(post);
    setFormOpenKey((k) => k + 1);
    setFormOpen(true);
  }

  const ordenados = [...posts].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div>
      <PageHeader
        title="Controle de Conteúdo"
        description="Calendário de posts (Reels, Carrossel e mais) em formato Kanban. Arraste os cards entre as colunas ou clique para editar."
        actions={<Button onClick={openNovo}><Plus className="size-3.5" /> Novo post</Button>}
      />

      <PostKanbanBoard posts={ordenados} onOpen={openEdit} />

      <PostFormDialog key={formOpenKey} open={formOpen} onOpenChange={setFormOpen} post={editingPost} />
    </div>
  );
}
