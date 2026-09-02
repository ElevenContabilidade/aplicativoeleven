/** Todo módulo que aparece no menu (exceto "Início", sempre liberado) e
 * pode ser restringido na matriz de permissões de Equipe. As chaves batem
 * exatamente com os `href` de `NAV_ITEMS` (nav-config.tsx). */
export const MODULO_POR_ROTA: Record<string, string> = {
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

export function permissaoKey(memberId: string, modulo: string, acao: string) {
  return `${memberId}-${modulo}-${acao}`;
}

/** Sem entrada explícita na matriz = liberado (comportamento padrão desde
 * sempre); só fica restrito quando alguém desmarca a ação de propósito. */
export function temPermissao(
  permissoes: Record<string, boolean>,
  memberId: string,
  modulo: string,
  acao: string = "Visualizar"
): boolean {
  const key = permissaoKey(memberId, modulo, acao);
  return key in permissoes ? permissoes[key] : true;
}
