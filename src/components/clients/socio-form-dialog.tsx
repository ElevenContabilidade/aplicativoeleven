"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store/app-store";
import type { Socio } from "@/lib/types";

export function SocioFormDialog({
  open,
  onOpenChange,
  clienteId,
  socio,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
  socio?: Socio | null;
}) {
  const addSocio = useAppStore((s) => s.addSocio);
  const updateSocio = useAppStore((s) => s.updateSocio);

  // The parent remounts this component (via a `key` tied to the sócio's id, or a
  // fresh id for "create new") whenever it should show a different record, so
  // plain useState initializers are enough — no effect needed to resync on open.
  const [nome, setNome] = useState(socio?.nome ?? "");
  const [cpf, setCpf] = useState(socio?.cpf ?? "");
  const [senhaGovBr, setSenhaGovBr] = useState(socio?.senhaGovBr ?? "");
  const [showSenha, setShowSenha] = useState(false);
  const [telefone, setTelefone] = useState(socio?.telefone ?? "");
  const [email, setEmail] = useState(socio?.email ?? "");
  const [percentual, setPercentual] = useState(socio ? String(socio.percentual) : "");
  const [administrador, setAdministrador] = useState(socio?.administrador ?? false);
  const [dataEntrada, setDataEntrada] = useState(socio?.dataEntrada ?? new Date().toISOString().slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !cpf.trim()) return;
    const patch: Omit<Socio, "id"> = {
      nome: nome.trim(),
      cpf: cpf.trim(),
      senhaGovBr: senhaGovBr || undefined,
      telefone: telefone || undefined,
      email: email || undefined,
      percentual: Number(percentual) || 0,
      administrador,
      dataEntrada,
    };
    if (socio) {
      updateSocio(clienteId, socio.id, patch);
    } else {
      addSocio(clienteId, { id: `so-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{socio ? "Editar sócio" : "Novo sócio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">CPF *</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
            </div>
            <div>
              <Label className="mb-1 block">% societário</Label>
              <Input type="number" min="0" max="100" step="0.01" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Data de entrada</Label>
              <Input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-sand-700">
                <Checkbox checked={administrador} onCheckedChange={(v) => setAdministrador(!!v)} />
                Administrador
              </label>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Senha gov.br</Label>
              <div className="relative">
                <Input
                  type={showSenha ? "text" : "password"}
                  value={senhaGovBr}
                  onChange={(e) => setSenhaGovBr(e.target.value)}
                  placeholder="Opcional — fica disponível para consulta no cadastro"
                  className="pr-9"
                />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{socio ? "Salvar alterações" : "Adicionar sócio"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
