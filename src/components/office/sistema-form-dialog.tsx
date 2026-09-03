"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import type { SistemaEscritorio } from "@/lib/types";

export function SistemaFormDialog({
  open,
  onOpenChange,
  sistema,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sistema?: SistemaEscritorio | null;
}) {
  const addSistemaEscritorio = useAppStore((s) => s.addSistemaEscritorio);
  const updateSistemaEscritorio = useAppStore((s) => s.updateSistemaEscritorio);

  const [nome, setNome] = useState(sistema?.nome ?? "");
  const [login, setLogin] = useState(sistema?.login ?? "");
  const [senha, setSenha] = useState(sistema?.senha ?? "");
  const [showSenha, setShowSenha] = useState(false);
  const [link, setLink] = useState(sistema?.link ?? "");
  const [valorMensal, setValorMensal] = useState(sistema?.valorMensal?.toString() ?? "");
  const [diaVencimento, setDiaVencimento] = useState(sistema?.diaVencimento?.toString() ?? "");
  const [observacoes, setObservacoes] = useState(sistema?.observacoes ?? "");

  function reset() {
    setNome(""); setLogin(""); setSenha(""); setShowSenha(false); setLink("");
    setValorMensal(""); setDiaVencimento(""); setObservacoes("");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const patch = {
      nome: nome.trim(),
      login: login.trim() || undefined,
      senha: senha.trim() || undefined,
      link: link.trim() || undefined,
      valorMensal: valorMensal ? Number(valorMensal) : undefined,
      diaVencimento: diaVencimento ? Number(diaVencimento) : undefined,
      observacoes: observacoes.trim() || undefined,
    };
    if (sistema) {
      updateSistemaEscritorio(sistema.id, patch);
    } else {
      addSistemaEscritorio({ id: `sis-${Date.now()}`, ...patch });
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sistema ? "Editar sistema" : "Novo sistema"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome do sistema *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Domínio Sistemas" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Login / usuário</Label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Senha</Label>
              <div className="relative">
                <Input type={showSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-9" />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  tabIndex={-1}
                >
                  {showSenha ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Site</Label>
              <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label className="mb-1 block">Valor mensal (R$)</Label>
              <Input type="number" step="0.01" min="0" value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label className="mb-1 block">Dia de vencimento</Label>
              <Input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} placeholder="Ex: 10" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit">{sistema ? "Salvar alterações" : "Cadastrar sistema"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
