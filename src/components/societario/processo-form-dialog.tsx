"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { nomesParceirosConhecidos, type ProcessoSocietario } from "@/lib/types";
import { etapasPadrao } from "@/lib/societario-checklist";
import { cn } from "@/lib/utils";

const TIPOS_SERVICO = ["Abertura", "Alteração", "Baixa", "Desenquadramento", "Balanço", "Livro Diário"];

export function ProcessoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addProcessoSocietario = useAppStore((s) => s.addProcessoSocietario);
  const clients = useAppStore((s) => s.clients);
  const extrasParceiro = useAppStore((s) => s.extrasParceiro);
  const { userId } = useAuthStore();

  const clientesOrdenados = useMemo(
    () => [...clients].sort((a, b) => a.dados.razaoSocial.localeCompare(b.dados.razaoSocial, "pt-BR")),
    [clients]
  );
  const parceiroOptions = useMemo(() => nomesParceirosConhecidos(clients, extrasParceiro), [clients, extrasParceiro]);

  const today = new Date().toISOString().slice(0, 10);

  const [clienteMode, setClienteMode] = useState<"existente" | "avulso">("existente");
  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [nomeAvulso, setNomeAvulso] = useState("");
  const [tipoServico, setTipoServico] = useState(TIPOS_SERVICO[0]);
  const [valor, setValor] = useState("");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [dataInicio, setDataInicio] = useState(today);
  const [observacoes, setObservacoes] = useState("");

  function reset() {
    setClienteMode("existente");
    setNomeAvulso("");
    setTipoServico(TIPOS_SERVICO[0]);
    setValor("");
    setNumeroProcesso("");
    setParceiro("");
    setDataInicio(today);
    setObservacoes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (clienteMode === "avulso" ? !nomeAvulso.trim() : !clienteId) return;
    if (!dataInicio) return;

    const etapas = etapasPadrao(tipoServico, userId ?? "u7", today, dataInicio);
    const valorNumero = valor ? Number(valor.replace(",", ".")) : undefined;
    const processo: ProcessoSocietario = {
      id: `ps-${Date.now()}`,
      // Avulso fica sem clienteId — não vira cadastro de cliente (nem
      // aparece em Onboarding) até alguém clicar "Virou cliente" no
      // processo depois.
      clienteId: clienteMode === "existente" ? clienteId : undefined,
      clienteNomeAvulso: clienteMode === "avulso" ? nomeAvulso.trim() : undefined,
      tipoServico,
      responsavelId: userId ?? "u7",
      protocolo: numeroProcesso || undefined,
      parceiro: parceiro.trim() || undefined,
      dataAbertura: dataInicio,
      status: "Solicitado",
      observacoes: observacoes || undefined,
      etapas,
      valorProcesso: valorNumero,
      pagamento: valorNumero ? "Pendente" : undefined,
    };
    addProcessoSocietario(processo);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo processo societário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente</Label>
            <div className="mb-2 inline-flex rounded-lg border border-sand-200 bg-sand-50 p-0.5">
              <button
                type="button"
                onClick={() => setClienteMode("existente")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  clienteMode === "existente" ? "bg-white text-wine-700 shadow-sm" : "text-sand-500 hover:text-sand-700"
                )}
              >
                Cliente já cadastrado
              </button>
              <button
                type="button"
                onClick={() => setClienteMode("avulso")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  clienteMode === "avulso" ? "bg-white text-wine-700 shadow-sm" : "text-sand-500 hover:text-sand-700"
                )}
              >
                Nome avulso
              </button>
            </div>
            {clienteMode === "existente" ? (
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clientesOrdenados.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Input
                  value={nomeAvulso}
                  onChange={(e) => setNomeAvulso(e.target.value)}
                  placeholder="Nome da empresa ou pessoa"
                  required
                />
                <p className="mt-1 text-[11px] text-sand-500">
                  Processo avulso, sem criar cadastro de cliente nem aparecer em Onboarding — útil pra quem só contratou esse
                  serviço pontual. Se a pessoa virar cliente depois, dá pra promover o processo direto na tela dele.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Tipo de serviço</Label>
              <Select value={tipoServico} onValueChange={setTipoServico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Valor do serviço (R$)</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label className="mb-1 block">Data de início do processo *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              <p className="mt-1 text-[11px] text-sand-500">Define em que ano/mês o processo entra nos filtros e relatórios.</p>
            </div>
            <div>
              <Label className="mb-1 block">Número do processo</Label>
              <Input value={numeroProcesso} onChange={(e) => setNumeroProcesso(e.target.value)} placeholder="Ex: JC-2209981" />
            </div>
            <div>
              <Label className="mb-1 block">Parceiro</Label>
              <Input value={parceiro} onChange={(e) => setParceiro(e.target.value)} placeholder="Quem indicou (se for o caso)" list="societario-form-parceiros" />
              <datalist id="societario-form-parceiros">
                {parceiroOptions.map((p) => (<option key={p} value={p} />))}
              </datalist>
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar processo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
