"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { gerarSenhaTemporaria } from "@/lib/senha-temporaria";
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
  const [convite, setConvite] = useState<{ email: string; senha: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [envioStatus, setEnvioStatus] = useState<"enviando" | "enviado" | "nao_configurado" | "erro" | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);
  const [emailErro, setEmailErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  function toggleDepartamento(d: Departamento) {
    setDepartamentos((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function handleClose(v: boolean) {
    if (!v) {
      setConvite(null);
      setCopiado(false);
      setEnvioStatus(null);
      setErroDetalhe(null);
      setEmailErro(null);
      setErroCriacao(null);
    }
    onOpenChange(v);
  }

  async function enviarConvitePorEmail(nome: string, email: string, senha: string) {
    setEnvioStatus("enviando");
    setErroDetalhe(null);
    try {
      const res = await fetch("/api/colaboradores/convite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      setEnvioStatus(data.sent ? "enviado" : data.configured === false ? "nao_configurado" : "erro");
      if (!data.sent && data.error) setErroDetalhe(String(data.error));
    } catch (err) {
      setEnvioStatus("erro");
      setErroDetalhe(err instanceof Error ? err.message : null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    const emailNormalizado = email.trim().toLowerCase();
    const duplicado = team.some((m) => m.email.toLowerCase() === emailNormalizado && m.id !== colaborador?.id);
    if (duplicado) {
      setEmailErro("Já existe um colaborador cadastrado com esse e-mail.");
      return;
    }
    setEmailErro(null);
    const patch = {
      nome: nome.trim(),
      email: email.trim(),
      celular: celular.trim() || undefined,
      perfil,
      departamentos,
    };
    if (colaborador) {
      updateTeamMember(colaborador.id, patch);
      onOpenChange(false);
      return;
    }

    setCriando(true);
    setErroCriacao(null);
    const senha = gerarSenhaTemporaria();
    const avatarColor = AVATAR_COLORS[team.length % AVATAR_COLORS.length];
    try {
      const res = await fetch("/api/colaboradores/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, senha, avatarColor }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErroCriacao(data.error ?? "Não foi possível criar o colaborador.");
        setCriando(false);
        return;
      }
      addTeamMember({ id: data.id, ...patch, avatarColor, ativo: true });
      setConvite({ email: patch.email, senha });
      void enviarConvitePorEmail(patch.nome, patch.email, senha);
    } catch (err) {
      setErroCriacao(err instanceof Error ? err.message : "Não foi possível criar o colaborador.");
    } finally {
      setCriando(false);
    }
  }

  async function copiarConvite() {
    if (!convite) return;
    const texto = `Acesso Eleven Hub\nE-mail: ${convite.email}\nSenha temporária: ${convite.senha}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — usuário copia manualmente pelo texto exibido
    }
  }

  if (convite) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convite gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            {envioStatus === "enviando" && (
              <p className="text-sand-600">Enviando e-mail de convite para {convite.email}…</p>
            )}
            {envioStatus === "enviado" && (
              <p className="text-status-success">
                E-mail enviado para {convite.email} com as instruções de acesso. Ele já pode entrar com essa senha
                temporária e trocá-la depois.
              </p>
            )}
            {envioStatus === "nao_configurado" && (
              <p className="text-sand-600">
                O envio automático de e-mail ainda não está configurado (falta a chave RESEND_API_KEY no ambiente).
                Copie as credenciais abaixo e repasse manualmente para o colaborador.
              </p>
            )}
            {envioStatus === "erro" && (
              <div className="space-y-1">
                <p className="text-status-danger">
                  Não foi possível enviar o e-mail agora. Copie as credenciais abaixo e repasse manualmente para o
                  colaborador.
                </p>
                {erroDetalhe && (
                  <p className="rounded-md bg-status-danger-bg px-2 py-1 font-mono text-[10px] text-status-danger">{erroDetalhe}</p>
                )}
              </div>
            )}
            <div className="space-y-1.5 rounded-lg border border-sand-200 bg-sand-50 p-3">
              <p><span className="text-sand-500">E-mail:</span> <span className="font-medium text-sand-900">{convite.email}</span></p>
              <p><span className="text-sand-500">Senha temporária:</span> <span className="font-mono font-medium text-sand-900">{convite.senha}</span></p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={copiarConvite} className="gap-1.5">
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiado ? "Copiado!" : "Copiar credenciais"}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => handleClose(false)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErro(null); }}
                placeholder="nome@eleven.com.br"
                required
              />
              {emailErro && <p className="mt-1 text-[11px] text-status-danger">{emailErro}</p>}
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
            <p className="mb-1.5 text-[11px] text-sand-500">
              Só pra referência interna (aparece no perfil do colaborador). Não controla o que ele consegue acessar —
              isso é feito na tabela de Permissões, na tela de Equipe.
            </p>
            <div className="flex flex-wrap gap-3">
              {DEPARTAMENTOS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-xs text-sand-700">
                  <Checkbox checked={departamentos.includes(d)} onCheckedChange={() => toggleDepartamento(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          {erroCriacao && <p className="text-xs text-status-danger">{erroCriacao}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit" disabled={criando}>
              {criando ? "Criando..." : colaborador ? "Salvar alterações" : "Cadastrar colaborador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
