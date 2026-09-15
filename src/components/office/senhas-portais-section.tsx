"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/app-store";
import type { SenhaPortalEscritorio } from "@/lib/types";

export function SenhasPortaisSection() {
  const senhas = useAppStore((s) => s.senhasPortais);
  const deleteSenhaPortal = useAppStore((s) => s.deleteSenhaPortal);

  const [revealedSenhas, setRevealedSenhas] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SenhaPortalEscritorio | null>(null);
  // Bump força o SenhaPortalFormDialog a remontar a cada abertura, senão
  // reabrir o MESMO portal logo após editá-lo reaproveita a instância que o
  // próprio dialog já tinha zerado ao fechar (mesmo bug corrigido em
  // Sistemas/Scripts/Certificados).
  const [formOpenKey, setFormOpenKey] = useState(0);

  function toggleSenha(id: string) {
    setRevealedSenhas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function copiarSenha(sp: SenhaPortalEscritorio) {
    try {
      await navigator.clipboard.writeText(sp.senha);
      setCopiedId(sp.id);
      setTimeout(() => setCopiedId((cur) => (cur === sp.id ? null : cur)), 2000);
    } catch {
      // clipboard indisponível
    }
  }

  function openNovo() {
    setEditing(null);
    setFormOpenKey((k) => k + 1);
    setFormOpen(true);
  }
  function openEdit(sp: SenhaPortalEscritorio) {
    setEditing(sp);
    setFormOpenKey((k) => k + 1);
    setFormOpen(true);
  }
  function handleDelete(sp: SenhaPortalEscritorio) {
    if (!confirm(`Excluir o acesso de "${sp.nomePortal}"?`)) return;
    deleteSenhaPortal(sp.id);
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Senhas de portais</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Acessos institucionais do escritório usados no dia a dia (SEFAZ, SEFIN, e-CAC etc.), sem ligação com um
            cliente específico.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNovo}>
          <Plus className="size-3.5" /> Novo portal
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Portal</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Senha</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {senhas.map((sp) => (
              <TableRow key={sp.id}>
                <TableCell>
                  <span className="font-medium text-sand-900">{sp.nomePortal}</span>
                  {sp.link && (
                    <a
                      href={sp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-wine-700 hover:underline"
                      title={sp.link}
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  {sp.observacoes && <span className="block text-[11px] text-sand-400">{sp.observacoes}</span>}
                </TableCell>
                <TableCell className="text-sand-600">{sp.usuario || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sand-700">{revealedSenhas.has(sp.id) ? sp.senha : "••••••••"}</span>
                    <button type="button" onClick={() => toggleSenha(sp.id)} className="text-sand-400 hover:text-sand-700" title={revealedSenhas.has(sp.id) ? "Ocultar senha" : "Mostrar senha"}>
                      {revealedSenhas.has(sp.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <button type="button" onClick={() => copiarSenha(sp)} className="text-sand-400 hover:text-sand-700" title="Copiar senha">
                      {copiedId === sp.id ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(sp)} title="Editar" className="rounded-md p-1.5 text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(sp)} title="Excluir" className="rounded-md p-1.5 text-sand-400 hover:bg-status-danger-bg hover:text-status-danger">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {senhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sand-400">
                  <KeyRound className="mx-auto mb-1.5 size-4 text-sand-300" />
                  Nenhum portal cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <SenhaPortalFormDialog key={formOpenKey} open={formOpen} onOpenChange={setFormOpen} senha={editing} />
    </Card>
  );
}

function SenhaPortalFormDialog({
  open,
  onOpenChange,
  senha,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  senha?: SenhaPortalEscritorio | null;
}) {
  const addSenhaPortal = useAppStore((s) => s.addSenhaPortal);
  const updateSenhaPortal = useAppStore((s) => s.updateSenhaPortal);

  const [nomePortal, setNomePortal] = useState(senha?.nomePortal ?? "");
  const [usuario, setUsuario] = useState(senha?.usuario ?? "");
  const [senhaValor, setSenhaValor] = useState(senha?.senha ?? "");
  const [link, setLink] = useState(senha?.link ?? "");
  const [observacoes, setObservacoes] = useState(senha?.observacoes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomePortal.trim() || !senhaValor.trim()) return;
    const patch = {
      nomePortal: nomePortal.trim(),
      usuario: usuario.trim() || undefined,
      senha: senhaValor.trim(),
      link: link.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };
    if (senha) {
      updateSenhaPortal(senha.id, patch);
    } else {
      addSenhaPortal({ id: `portal-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{senha ? "Editar portal" : "Novo portal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Portal *</Label>
            <Input value={nomePortal} onChange={(e) => setNomePortal(e.target.value)} placeholder="Ex: SEFAZ, SEFIN, e-CAC" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Usuário</Label>
              <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="CNPJ, login..." />
            </div>
            <div>
              <Label className="mb-1 block">Senha *</Label>
              <Input value={senhaValor} onChange={(e) => setSenhaValor(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Link do portal</Label>
            <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label className="mb-1 block">Observações</Label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex: usar sempre o certificado A1 do escritório" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{senha ? "Salvar alterações" : "Adicionar portal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
