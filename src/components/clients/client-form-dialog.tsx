"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { CLIENT_STATUS, type Client, type ClientStatus, type DadosCadastrais } from "@/lib/types";

const REGIMES: DadosCadastrais["regimeTributario"][] = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"];

export function ClientFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const addClient = useAppStore((s) => s.addClient);
  const { userId } = useAuthStore();

  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segmento, setSegmento] = useState("");
  const [regime, setRegime] = useState<DadosCadastrais["regimeTributario"]>("Simples Nacional");
  const [status, setStatus] = useState<ClientStatus>("Onboarding");
  const [valorMensal, setValorMensal] = useState("");

  function reset() {
    setRazaoSocial(""); setNomeFantasia(""); setCnpj(""); setSegmento("");
    setRegime("Simples Nacional"); setStatus("Onboarding"); setValorMensal("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!razaoSocial || !cnpj) return;
    const today = new Date().toISOString().slice(0, 10);
    const id = `c-${Date.now()}`;
    const client: Client = {
      id,
      status,
      dados: {
        razaoSocial,
        nomeFantasia: nomeFantasia || undefined,
        cnpj,
        cnaePrincipal: "—",
        cnaesSecundarios: [],
        naturezaJuridica: "Sociedade Empresária Limitada",
        dataAbertura: today,
        capitalSocial: 0,
        regimeTributario: regime,
        municipio: "—",
        estado: "—",
        endereco: "—",
      },
      socios: [],
      contatos: [],
      responsaveis: { comercial: userId ?? undefined, relacionamento: userId ?? undefined },
      segmento: segmento || "Outros",
      tags: [],
      financeiro: {
        valorMensal: Number(valorMensal) || 0,
        vencimentoDia: 10,
        formaPagamento: "Boleto",
        inicioContrato: today,
        statusFinanceiro: "Em aberto",
      },
      historicoFinanceiro: [],
      onboarding: [],
      criadoEm: today,
    };
    addClient(client);
    reset();
    onOpenChange(false);
    router.push(`/clientes/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Razão social *</Label>
            <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Nome fantasia</Label>
              <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">CNPJ *</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" required />
            </div>
            <div>
              <Label className="mb-1 block">Segmento</Label>
              <Input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: Clínica odontológica" />
            </div>
            <div>
              <Label className="mb-1 block">Mensalidade (R$)</Label>
              <Input type="number" value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Regime tributário</Label>
              <Select value={regime} onValueChange={(v) => setRegime(v as DadosCadastrais["regimeTributario"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGIMES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Cadastrar cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
