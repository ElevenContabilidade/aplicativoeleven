"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { CLIENT_STATUS, ONBOARDING_TEMPLATE, type Client, type ClientStatus, type DadosCadastrais } from "@/lib/types";
import { lookupCnpj, maskCnpj, onlyDigits } from "@/lib/cnpj";

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
  const [dadosExtra, setDadosExtra] = useState<Partial<DadosCadastrais>>({});
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState<string | null>(null);

  function reset() {
    setRazaoSocial(""); setNomeFantasia(""); setCnpj(""); setSegmento("");
    setRegime("Simples Nacional"); setStatus("Onboarding"); setValorMensal("");
    setDadosExtra({}); setBuscaErro(null);
  }

  async function buscarCnpj() {
    if (onlyDigits(cnpj).length !== 14) {
      setBuscaErro("Digite os 14 dígitos do CNPJ para buscar.");
      return;
    }
    setBuscando(true);
    setBuscaErro(null);
    try {
      const dados = await lookupCnpj(cnpj);
      setRazaoSocial(dados.razaoSocial);
      setNomeFantasia(dados.nomeFantasia ?? "");
      if (dados.regimeTributario) setRegime(dados.regimeTributario);
      setDadosExtra({
        cnaePrincipal: dados.cnaePrincipal,
        cnaesSecundarios: dados.cnaesSecundarios,
        naturezaJuridica: dados.naturezaJuridica,
        dataAbertura: dados.dataAbertura,
        capitalSocial: dados.capitalSocial,
        municipio: dados.municipio,
        estado: dados.estado,
        endereco: dados.endereco,
      });
    } catch (err) {
      setBuscaErro(err instanceof Error ? err.message : "Não foi possível consultar o CNPJ.");
    } finally {
      setBuscando(false);
    }
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
        cnaePrincipal: dadosExtra.cnaePrincipal ?? "—",
        cnaesSecundarios: dadosExtra.cnaesSecundarios ?? [],
        naturezaJuridica: dadosExtra.naturezaJuridica ?? "Sociedade Empresária Limitada",
        dataAbertura: dadosExtra.dataAbertura ?? today,
        capitalSocial: dadosExtra.capitalSocial ?? 0,
        regimeTributario: regime,
        municipio: dadosExtra.municipio ?? "—",
        estado: dadosExtra.estado ?? "—",
        endereco: dadosExtra.endereco ?? "—",
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
      onboarding: ONBOARDING_TEMPLATE.map((label, i) => ({ id: `ob-${id}-${i}`, label, concluido: false })),
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
            <Label className="mb-1 block">CNPJ *</Label>
            <div className="flex gap-2">
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                onBlur={() => onlyDigits(cnpj).length === 14 && buscarCnpj()}
                placeholder="00.000.000/0001-00"
                required
              />
              <Button type="button" variant="outline" onClick={buscarCnpj} disabled={buscando} className="shrink-0">
                {buscando ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                Buscar
              </Button>
            </div>
            {buscaErro && <p className="mt-1 text-[11px] text-status-danger">{buscaErro}</p>}
            {!buscaErro && dadosExtra.municipio && (
              <p className="mt-1 text-[11px] text-status-success">Dados preenchidos automaticamente pela Receita Federal.</p>
            )}
          </div>
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
