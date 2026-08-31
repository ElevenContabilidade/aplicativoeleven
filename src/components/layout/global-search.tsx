"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, UsersRound, ListChecks, ShieldCheck, FolderOpen, Receipt } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

type ResultGroup = {
  key: string;
  label: string;
  icon: typeof Building2;
  items: { id: string; title: string; subtitle: string; href: string }[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const clients = useAppStore((s) => s.clients);
  const leads = useAppStore((s) => s.leads);
  const tasks = useAppStore((s) => s.tasks);
  const certificados = useAppStore((s) => s.certificados);
  const documentos = useAppStore((s) => s.documentos);
  const parcelamentos = useAppStore((s) => s.parcelamentos);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups: ResultGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const clientOf = (id: string) => clients.find((c) => c.id === id);

    return [
      {
        key: "clientes",
        label: "Clientes",
        icon: Building2,
        items: clients
          .filter(
            (c) =>
              c.dados.razaoSocial.toLowerCase().includes(q) ||
              (c.dados.nomeFantasia ?? "").toLowerCase().includes(q) ||
              c.dados.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
              c.socios.some((s) => s.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "")))
          )
          .slice(0, 6)
          .map((c) => ({ id: c.id, title: c.dados.nomeFantasia ?? c.dados.razaoSocial, subtitle: c.dados.cnpj, href: `/clientes/${c.id}` })),
      },
      {
        key: "leads",
        label: "Leads",
        icon: UsersRound,
        items: leads
          .filter(
            (l) =>
              l.nome.toLowerCase().includes(q) ||
              (l.empresa ?? "").toLowerCase().includes(q) ||
              l.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
          )
          .slice(0, 6)
          .map((l) => ({ id: l.id, title: l.nome, subtitle: l.empresa ?? l.telefone, href: `/leads` })),
      },
      {
        key: "tarefas",
        label: "Tarefas",
        icon: ListChecks,
        items: tasks
          .filter((t) => t.titulo.toLowerCase().includes(q))
          .slice(0, 6)
          .map((t) => ({ id: t.id, title: t.titulo, subtitle: t.clienteId ? (clientOf(t.clienteId)?.dados.nomeFantasia ?? "") : t.departamento, href: `/tarefas` })),
      },
      {
        key: "certificados",
        label: "Certificados",
        icon: ShieldCheck,
        items: certificados
          .filter((c) => c.documento.replace(/\D/g, "").includes(q.replace(/\D/g, "")) || (c.protocolo ?? "").toLowerCase().includes(q))
          .slice(0, 6)
          .map((c) => ({ id: c.id, title: c.tipo, subtitle: clientOf(c.clienteId)?.dados.nomeFantasia ?? "", href: `/certificados` })),
      },
      {
        key: "documentos",
        label: "Documentos",
        icon: FolderOpen,
        items: documentos
          .filter((d) => d.nome.toLowerCase().includes(q))
          .slice(0, 6)
          .map((d) => ({ id: d.id, title: d.nome, subtitle: clientOf(d.clienteId)?.dados.nomeFantasia ?? "", href: `/documentos` })),
      },
      {
        key: "parcelamentos",
        label: "Parcelamentos",
        icon: Receipt,
        items: parcelamentos
          .filter((p) => p.clienteNome.toLowerCase().includes(q) || p.tipo.toLowerCase().includes(q))
          .slice(0, 6)
          .map((p) => ({ id: p.id, title: p.tipo, subtitle: p.clienteNome, href: `/parcelamentos` })),
      },
    ].filter((g) => g.items.length > 0);
  }, [query, clients, leads, tasks, certificados, documentos, parcelamentos]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 text-xs text-sand-400 transition-colors hover:border-sand-300 hover:bg-white"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:block">Buscar cliente, CNPJ, tarefa, protocolo…</span>
        <span className="flex-1 truncate text-left sm:hidden">Buscar…</span>
        <kbd className="hidden shrink-0 rounded border border-sand-300 bg-white px-1.5 py-0.5 text-[10px] text-sand-400 sm:block">⌘K</kbd>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-sand-900/40 backdrop-blur-[1px]" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-24 z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl focus:outline-none"
          >
            <DialogPrimitive.Title className="sr-only">Busca global</DialogPrimitive.Title>
            <div className="flex items-center gap-2 border-b border-sand-200 px-4">
              <Search className="size-4 text-sand-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente, empresa, CPF, CNPJ, telefone, protocolo, tarefa…"
                className="h-12 flex-1 bg-transparent text-sm text-sand-900 outline-none placeholder:text-sand-400"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
              {query.trim() === "" && (
                <p className="px-3 py-8 text-center text-xs text-sand-400">
                  Digite para buscar em clientes, leads, tarefas, certificados e documentos.
                </p>
              )}
              {query.trim() !== "" && groups.length === 0 && (
                <p className="px-3 py-8 text-center text-xs text-sand-400">Nenhum resultado para “{query}”.</p>
              )}
              {groups.map((g) => (
                <div key={g.key} className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-sand-400">{g.label}</p>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-wine-50"
                      )}
                    >
                      <g.icon className="size-4 shrink-0 text-wine-600" />
                      <span className="flex-1 truncate">
                        <span className="font-medium text-sand-900">{item.title}</span>
                        {item.subtitle && <span className="ml-2 text-xs text-sand-400">{item.subtitle}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
