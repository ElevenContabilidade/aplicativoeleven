/** Todo módulo que aparece no menu (exceto "Início", sempre liberado) e
 * pode ser restringido na matriz de permissões de Equipe. As chaves batem
 * exatamente com os `href` de `NAV_ITEMS` (nav-config.tsx). */
export const MODULO_POR_ROTA: Record<string, string> = {
  "/dados-escritorio": "Dados do Escritório",
  "/comercial": "Comercial",
  "/leads": "Leads",
  "/clientes": "Clientes",
  "/onboarding": "Onboarding",
  "/tarefas": "Tarefas",
  "/obrigacoes": "Obrigações",
  "/fiscal": "Fiscal",
  "/mei": "MEI",
  "/parcelamentos": "Parcelamentos",
  "/contabil": "Contábil",
  "/dp": "Departamento Pessoal",
  "/societario": "Societário",
  "/certificados": "Certificados",
  "/documentos": "Documentos",
  "/financeiro": "Financeiro",
  "/boletos": "Boletos",
  "/nfse": "NFSe",
  "/faturamento": "Faturamento",
  "/parceiros": "Parceiros",
  "/portfolio": "Portfólio",
  "/atendimento": "Atendimento",
  "/relatorios": "Relatórios",
  "/equipe": "Equipe",
  "/eleven-ia": "Eleven IA",
  "/configuracoes": "Configurações",
};

export function moduloDaRota(pathname: string): string | undefined {
  const rota = Object.keys(MODULO_POR_ROTA).find((r) => pathname === r || pathname.startsWith(`${r}/`));
  return rota ? MODULO_POR_ROTA[rota] : undefined;
}

export const MODULOS_OPERACAO = [
  "Dados do Escritório", "Comercial", "Leads", "Clientes", "Onboarding", "Tarefas", "Obrigações", "Fiscal", "MEI", "Parcelamentos", "Contábil", "Departamento Pessoal", "Societário", "Certificados", "Documentos",
];
export const MODULOS_GESTAO = ["Financeiro", "Boletos", "NFSe", "Faturamento", "Parceiros", "Portfólio", "Atendimento", "Relatórios", "Equipe", "Eleven IA", "Configurações"];
export const ACOES = ["Visualizar", "Criar", "Editar", "Excluir", "Exportar"];

// "|" e não "-" porque memberId agora é um UUID do Supabase (tem hífen
// dentro), então um separador "-" ficaria ambíguo pra desmontar a chave de
// volta em memberId/modulo/acao (feito em app-store.ts ao sincronizar com
// a tabela `permissions`).
export function permissaoKey(memberId: string, modulo: string, acao: string) {
  return `${memberId}|${modulo}|${acao}`;
}

export function parsePermissaoKey(key: string): { memberId: string; modulo: string; acao: string } | null {
  const partes = key.split("|");
  if (partes.length !== 3) return null;
  const [memberId, modulo, acao] = partes;
  return { memberId, modulo, acao };
}

/** Sem entrada explícita na matriz = liberado. Todo colaborador (novo ou
 * antigo) começa com acesso normal a tudo; quem administra restringe
 * pontualmente o que aquele colaborador não deve acessar (ex: Financeiro). */
export function temPermissao(
  permissoes: Record<string, boolean>,
  memberId: string,
  modulo: string,
  acao: string = "Visualizar"
): boolean {
  const key = permissaoKey(memberId, modulo, acao);
  return key in permissoes ? permissoes[key] : true;
}
