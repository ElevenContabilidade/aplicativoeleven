"use client";

import { useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { CONTEUDO_FORMATOS, CONTEUDO_STATUS, type ConteudoFormato, type ConteudoImagem, type ConteudoPost, type ConteudoStatus } from "@/lib/types";

function fileParaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PostFormDialog({
  open,
  onOpenChange,
  post,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Quando presente, o dialog edita esse post em vez de criar um novo. O
   * pai remonta esse componente (via `key`) a cada abertura, então esses
   * useState iniciais bastam mesmo reabrindo o MESMO post logo após editar. */
  post?: ConteudoPost | null;
}) {
  const addConteudoPost = useAppStore((s) => s.addConteudoPost);
  const updateConteudoPost = useAppStore((s) => s.updateConteudoPost);
  const deleteConteudoPost = useAppStore((s) => s.deleteConteudoPost);

  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(post?.data ?? hoje);
  const [formato, setFormato] = useState<ConteudoFormato>(post?.formato ?? "Reels");
  const [tema, setTema] = useState(post?.tema ?? "");
  const [status, setStatus] = useState<ConteudoStatus>(post?.status ?? "A fazer");
  const [organizacao, setOrganizacao] = useState(post?.organizacao ?? "");
  const [linkDocumento, setLinkDocumento] = useState(post?.linkDocumento ?? "");
  const [imagens, setImagens] = useState<ConteudoImagem[]>(post?.imagens ?? []);
  const [visualizacoes, setVisualizacoes] = useState(post?.visualizacoes?.toString() ?? "");
  const [salvamentos, setSalvamentos] = useState(post?.salvamentos?.toString() ?? "");
  const [compartilhamentos, setCompartilhamentos] = useState(post?.compartilhamentos?.toString() ?? "");
  const [comentarios, setComentarios] = useState(post?.comentarios?.toString() ?? "");
  const [observacoes, setObservacoes] = useState(post?.observacoes ?? "");
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  async function handleAnexarImagens(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEnviandoImagem(true);
    try {
      const novas: ConteudoImagem[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await fileParaDataUrl(file);
        novas.push({ id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nome: file.name, dataUrl });
      }
      setImagens((prev) => [...prev, ...novas]);
    } finally {
      setEnviandoImagem(false);
    }
  }

  function removerImagem(id: string) {
    setImagens((prev) => prev.filter((img) => img.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tema.trim()) return;
    const patch = {
      data,
      formato,
      tema: tema.trim(),
      status,
      organizacao: organizacao.trim() || undefined,
      linkDocumento: linkDocumento.trim() || undefined,
      imagens,
      visualizacoes: visualizacoes ? Number(visualizacoes) : undefined,
      salvamentos: salvamentos ? Number(salvamentos) : undefined,
      compartilhamentos: compartilhamentos ? Number(compartilhamentos) : undefined,
      comentarios: comentarios ? Number(comentarios) : undefined,
      observacoes: observacoes.trim() || undefined,
    };
    if (post) {
      updateConteudoPost(post.id, patch);
    } else {
      addConteudoPost({ id: `conteudo-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  function handleDelete() {
    if (!post) return;
    if (confirm(`Excluir o post "${post.tema}"?`)) {
      deleteConteudoPost(post.id);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Editar post" : "Novo post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Formato</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as ConteudoFormato)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEUDO_FORMATOS.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Tema *</Label>
              <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: 5 documentos essenciais" required />
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ConteudoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEUDO_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Link do documento</Label>
              <Input type="url" value={linkDocumento} onChange={(e) => setLinkDocumento(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Organização do conteúdo</Label>
            <Textarea
              value={organizacao}
              onChange={(e) => setOrganizacao(e.target.value)}
              placeholder="Como esse conteúdo vai ser organizado/roteirizado..."
              rows={4}
            />
          </div>

          <div>
            <Label className="mb-1 block">Imagens</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-3 text-center hover:border-wine-400 hover:bg-wine-50">
              <ImagePlus className="size-4 text-wine-500" />
              <span className="text-xs font-medium text-sand-700">
                {enviandoImagem ? "Carregando..." : "Clique para anexar imagens"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={enviandoImagem}
                onChange={(e) => { void handleAnexarImagens(e.target.files); e.target.value = ""; }}
              />
            </label>
            {imagens.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {imagens.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-sand-200">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem é um data URL (base64), não um asset otimizável pelo next/image */}
                    <img src={img.dataUrl} alt={img.nome} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerImagem(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Remover imagem"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1 block">Métricas (opcional, preencha depois de publicar)</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input type="number" min="0" value={visualizacoes} onChange={(e) => setVisualizacoes(e.target.value)} placeholder="Visualizações" />
              <Input type="number" min="0" value={salvamentos} onChange={(e) => setSalvamentos(e.target.value)} placeholder="Salvamentos" />
              <Input type="number" min="0" value={compartilhamentos} onChange={(e) => setCompartilhamentos(e.target.value)} placeholder="Compart." />
              <Input type="number" min="0" value={comentarios} onChange={(e) => setComentarios(e.target.value)} placeholder="Comentários" />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {post ? (
              <Button type="button" variant="outline" onClick={handleDelete} className="text-status-danger hover:text-status-danger">
                <Trash2 className="size-3.5" /> Excluir
              </Button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{post ? "Salvar alterações" : "Cadastrar post"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
