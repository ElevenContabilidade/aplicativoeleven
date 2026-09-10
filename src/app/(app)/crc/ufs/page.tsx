"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, MapPin, ExternalLink, Check, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { ESTADOS_BRASIL } from "@/lib/estados-brasil";

export default function CrcUfsPage() {
  const ufs = useAppStore((s) => s.crcUfs);
  const addCrcUf = useAppStore((s) => s.addCrcUf);
  const updateCrcUf = useAppStore((s) => s.updateCrcUf);
  const deleteCrcUf = useAppStore((s) => s.deleteCrcUf);
  const linkPortalUf = useAppStore((s) => s.crcRegistroPessoal.linkPortalUf);
  const senhaPessoal = useAppStore((s) => s.crcRegistroPessoal.senhaComunicacaoUf);
  const senhaEmpresa = useAppStore((s) => s.crcRegistroEmpresa.senhaComunicacaoUf);
  const updateCrcRegistro = useAppStore((s) => s.updateCrcRegistro);

  const [novoEstado, setNovoEstado] = useState("");
  const [siteForm, setSiteForm] = useState(linkPortalUf ?? "");
  const [senhaPfForm, setSenhaPfForm] = useState(senhaPessoal ?? "");
  const [senhaPjForm, setSenhaPjForm] = useState(senhaEmpresa ?? "");
  const [showSenhaPf, setShowSenhaPf] = useState(false);
  const [showSenhaPj, setShowSenhaPj] = useState(false);
  const [siteSavedAt, setSiteSavedAt] = useState<number | null>(null);
  const siteDirtyRef = useRef(false);

  // No F5 a store começa vazia e só recebe o valor de verdade do Supabase
  // um instante depois — resincroniza enquanto o usuário não começou a editar.
  useEffect(() => {
    if (!siteDirtyRef.current) {
      setSiteForm(linkPortalUf ?? "");
      setSenhaPfForm(senhaPessoal ?? "");
      setSenhaPjForm(senhaEmpresa ?? "");
    }
  }, [linkPortalUf, senhaPessoal, senhaEmpresa]);

  const disponiveis = ESTADOS_BRASIL.filter((e) => !ufs.some((u) => u.estado === e.sigla));

  function handleAdicionar() {
    if (!novoEstado) return;
    addCrcUf({ id: `crc-uf-${Date.now()}`, estado: novoEstado });
    setNovoEstado("");
  }

  function handleSalvarSite(e: React.FormEvent) {
    e.preventDefault();
    // Site + senha PF vão juntos no mesmo registro (crcRegistroPessoal) —
    // uma única chamada pros dois campos evita dois pushes concorrentes
    // pro mesmo registro (um poderia sobrescrever o outro fora de ordem).
    // A senha PJ é outro registro (crcRegistroEmpresa), então é uma
    // chamada à parte, sem risco de corrida com a de cima.
    updateCrcRegistro("pessoal", {
      linkPortalUf: siteForm.trim() || undefined,
      senhaComunicacaoUf: senhaPfForm.trim() || undefined,
    });
    updateCrcRegistro("empresa", { senhaComunicacaoUf: senhaPjForm.trim() || undefined });
    setSiteSavedAt(Date.now());
    setTimeout(() => setSiteSavedAt(null), 2500);
  }

  return (
    <div>
      <Link href="/crc" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-sand-500 hover:text-wine-700">
        <ArrowLeft className="size-3.5" /> Voltar para Gestão do CRC
      </Link>
      <PageHeader title="Comunicação de atuação em outra UF" description="Estados onde já comunicamos o exercício profissional, separado por CRC pessoal e empresa." />

      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={handleSalvarSite} className="flex flex-wrap items-end gap-2">
            <div>
              <Label className="mb-1 block text-xs">Site onde fazemos essa comunicação</Label>
              <Input
                type="url"
                value={siteForm}
                onChange={(e) => { siteDirtyRef.current = true; setSiteForm(e.target.value); }}
                placeholder="https://... (portal do CRC de origem)"
                className="w-72"
                autoComplete="off"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Senha PF</Label>
              <div className="relative w-40">
                <Input
                  type={showSenhaPf ? "text" : "password"}
                  value={senhaPfForm}
                  onChange={(e) => { siteDirtyRef.current = true; setSenhaPfForm(e.target.value); }}
                  className="pr-9"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaPf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  tabIndex={-1}
                >
                  {showSenhaPf ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Senha PJ</Label>
              <div className="relative w-40">
                <Input
                  type={showSenhaPj ? "text" : "password"}
                  value={senhaPjForm}
                  onChange={(e) => { siteDirtyRef.current = true; setSenhaPjForm(e.target.value); }}
                  className="pr-9"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaPj((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  tabIndex={-1}
                >
                  {showSenhaPj ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline">Salvar</Button>
            {linkPortalUf && (
              <a href={linkPortalUf} target="_blank" rel="noopener noreferrer">
                <Button type="button" size="sm" variant="outline">
                  <ExternalLink className="size-3.5" /> Abrir site
                </Button>
              </a>
            )}
            {siteSavedAt && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ufs.map((uf) => {
          const estado = ESTADOS_BRASIL.find((e) => e.sigla === uf.estado);
          return (
            <Card key={uf.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-sand-100 text-sand-500">
                      <MapPin className="size-4" />
                    </span>
                    <span className="font-medium text-sand-900">{estado?.nome ?? uf.estado}</span>
                  </div>
                  <button type="button" onClick={() => deleteCrcUf(uf.id)} className="text-sand-400 hover:text-status-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sand-600">
                      <span className={`size-1.5 rounded-full ${uf.pessoalData ? "bg-status-success" : "bg-sand-300"}`} />
                      Pessoal
                    </span>
                    <Input
                      type="date"
                      value={uf.pessoalData ?? ""}
                      onChange={(e) => updateCrcUf(uf.id, { pessoalData: e.target.value || undefined })}
                      className="h-7 w-36 text-[11px]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sand-600">
                      <span className={`size-1.5 rounded-full ${uf.empresaData ? "bg-status-success" : "bg-sand-300"}`} />
                      Empresa
                    </span>
                    <Input
                      type="date"
                      value={uf.empresaData ?? ""}
                      onChange={(e) => updateCrcUf(uf.id, { empresaData: e.target.value || undefined })}
                      className="h-7 w-36 text-[11px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border-dashed">
          <CardContent className="flex h-full flex-col justify-center gap-2 p-4">
            <Label className="text-xs">Adicionar UF</Label>
            <Select value={novoEstado} onValueChange={setNovoEstado}>
              <SelectTrigger><SelectValue placeholder="Escolha o estado" /></SelectTrigger>
              <SelectContent>
                {disponiveis.map((e) => (
                  <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={handleAdicionar} disabled={!novoEstado}>
              <Plus className="size-3.5" /> Adicionar UF
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent className="p-5 text-xs text-sand-600">
          <h3 className="mb-2 font-display text-sm font-semibold text-sand-900">
            Passo a passo: como comunicar o exercício em outra jurisdição
          </h3>
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>Acessar o portal do CRC de origem do registro (ex: CRC-CE) e fazer login com o código de acesso.</li>
            <li>Procurar a seção &ldquo;Comunicação de exercício profissional em outra UF&rdquo; (às vezes chamada de &ldquo;Registro em outra jurisdição&rdquo;).</li>
            <li>Informar a UF onde o serviço será prestado e o(s) cliente(s)/contrato(s) relacionados.</li>
            <li>Confirmar o envio e guardar o comprovante — a data usada aqui em &ldquo;Pessoal&rdquo;/&ldquo;Empresa&rdquo; é a data desse comprovante.</li>
          </ol>
          <p className="mt-2 text-[11px] text-sand-400">Ajuste esse passo a passo se o procedimento do seu CRC de origem for diferente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
