"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { TeamMember, PerfilEquipe, Departamento } from "@/lib/types";

const PERFIS: PerfilEquipe[] = [
  "Administrador", "Gestor", "Comercial", "Fiscal", "Contábil", "Departamento Pessoal", "Societário", "Financeiro", "Atendimento",
];
const DEPARTAMENTOS: Departamento[] = [
  "Comercial", "Relacionamento", "Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Atendimento",
];
const AVATAR_COLORS = ["#5C1420", "#8A2F3E", "#B4791F", "#3E6B8A", "#2E7D53", "#711F2C"];

export function ColaboradorFormDialog({
  open,
  onOpenChange,
  colaborador,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  colaborador?: TeamMember | null;
}) {
  const team = useAppStore((s) => s.team);
  const addTeamMember = useAppStore((s) => s.addTeamMember);
  const updateTeamMember = useAppStore((s) => s.updateTeamMember);

  const [nome, setNome] = useState(colaborador?.nome ?? "");
  const [email, setEmail] = useState(colaborador?.email ?? "");
  const [celular, setCelular] = useState(colaborador?.celular ?? "");
  const [perfil, setPerfil] = useState<PerfilEquipe>(colaborador?.perfil ?? "Comercial");
  const [departamentos, setDepartamentos] = useState<Departamento[]>(colaborador?.departamentos ?? []);

  function toggleDepartamento(d: Departamento) {
    setDepartamentos((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    const patch = {
      nome: nome.trim(),
      email: email.trim(),
      celular: celular.trim() || undefined,
      perfil,
      departamentos,
    };
    if (colaborador) {
      updateTeamMember(colaborador.id, patch);
    } else {
      addTeamMember({
        id: `u-${Date.now()}`,
        ...patch,
        avatarColor: AVATAR_COLORS[team.length % AVATAR_COLORS.length],
        ativo: true,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{colaborador ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required />
            </div>
            <div>
              <Label className="mb-1 block">E-mail *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@eleven.com.br" required />
            </div>
            <div>
              <Label className="mb-1 block">Celular</Label>
              <Input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="DDD + número" />
            </div>
            <div>
              <Label className="mb-1 block">Perfil</Label>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as PerfilEquipe)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Departamentos</Label>
            <div className="flex flex-wrap gap-3">
              {DEPARTAMENTOS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-xs text-sand-700">
                  <Checkbox checked={departamentos.includes(d)} onCheckedChange={() => toggleDepartamento(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{colaborador ? "Salvar alterações" : "Cadastrar colaborador"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
