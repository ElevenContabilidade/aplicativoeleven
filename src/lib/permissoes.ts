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
  "Dados do Escritório", "Comercial", "Leads", "Clientes", "Onboarding", "Tarefas", "Fiscal", "MEI", "Parcelamentos", "Contábil", "Departamento Pessoal", "Societário", "Certificados", "Documentos",
];
export const MODULOS_GESTAO = ["Financeiro", "Boletos", "NFSe", "Parceiros", "Portfólio", "Atendimento", "Relatórios", "Equipe", "Eleven IA", "Configurações"];
export const ACOES = ["Visualizar", "Criar", "Editar", "Excluir", "Exportar"];

export function permissaoKey(memberId: string, modulo: string, acao: string) {
  return `${memberId}-${modulo}-${acao}`;
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
