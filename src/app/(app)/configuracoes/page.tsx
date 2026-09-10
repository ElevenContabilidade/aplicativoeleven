"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EleveMark } from "@/components/brand/logo";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamMember } from "@/lib/team-lookup";
import { initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { userId, logout } = useAuthStore();
  const me = teamMember(userId ?? "");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [digestSemanal, setDigestSemanal] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [senhaSalva, setSenhaSalva] = useState(false);

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErroSenha(null);
    setSenhaSalva(false);
    if (novaSenha.length < 6) {
      setErroSenha("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }
    setSalvandoSenha(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha("");
      setConfirmarSenha("");
      setSenhaSalva(true);
    } catch (err) {
      setErroSenha(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configurações" description="Preferências de conta, notificações e dados da plataforma." />

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Meu perfil</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="text-sm">{initials(me?.nome ?? "EL")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sand-900">{me?.nome}</p>
                <p className="text-xs text-sand-500">{me?.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Nome</Label>
                <Input defaultValue={me?.nome} />
              </div>
              <div>
                <Label className="mb-1 block">E-mail</Label>
                <Input defaultValue={me?.email} disabled />
              </div>
              <div>
                <Label className="mb-1 block">Perfil de acesso</Label>
                <Input defaultValue={me?.perfil} disabled />
              </div>
              <div>
                <Label className="mb-1 block">Departamentos</Label>
                <Input defaultValue={me?.departamentos.join(", ")} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="size-4 text-wine-700" /> Alterar senha</CardTitle>
            <CardDescription>Troque a senha padrão recebida no convite por uma de sua escolha.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAlterarSenha} className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Nova senha</Label>
                <Input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block">Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Button type="submit" size="sm" disabled={salvandoSenha}>
                  {salvandoSenha && <Loader2 className="size-3.5 animate-spin" />}
                  {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
                </Button>
                {senhaSalva && <span className="text-xs text-status-success">Senha alterada com sucesso.</span>}
                {erroSenha && <span className="text-xs text-status-danger">{erroSenha}</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Row label="Alertas por e-mail" description="Receba obrigações, certificados e cobranças por e-mail.">
              <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
            </Row>
            <Row label="Notificações push" description="Alertas em tempo real dentro da plataforma.">
              <Switch checked={notifPush} onCheckedChange={setNotifPush} />
            </Row>
            <Row label="Resumo semanal" description="Receba um resumo executivo toda segunda-feira.">
              <Switch checked={digestSemanal} onCheckedChange={setDigestSemanal} />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><EleveMark className="size-4 text-wine-700" /> Sobre a plataforma</CardTitle>
            <CardDescription>Eleven Hub — CRM e gestão operacional da Eleven Contabilidade &amp; Consultoria</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-sand-500">
            <p>Versão 1.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conta</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" size="sm" onClick={() => { logout(); router.push("/login"); }}>
              <LogOut className="size-3.5" /> Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-sand-800">{label}</p>
        <p className="text-xs text-sand-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
