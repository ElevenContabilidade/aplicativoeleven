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

export const MODULOS_OPERACAO = [
  "Comercial", "Leads", "Clientes", "Onboarding", "Tarefas", "Fiscal", "MEI", "Parcelamentos", "Contábil", "Departamento Pessoal", "Societário", "Certificados", "Documentos",
];
export const MODULOS_GESTAO = ["Financeiro", "Boletos", "NFSe", "Parceiros", "Portfólio", "Atendimento", "Relatórios", "Equipe", "Eleven IA", "Configurações"];
export const ACOES = ["Visualizar", "Criar", "Editar", "Excluir", "Exportar"];

export function permissaoKey(memberId: string, modulo: string, acao: string) {
  return `${memberId}-${modulo}-${acao}`;
}

/** Sem entrada explícita na matriz = liberado — vale pros colaboradores que
 * já existiam antes desse controle (não vamos tirar acesso de ninguém sem
 * avisar). Colaboradores CADASTRADOS DAQUI PRA FRENTE já nascem com um
 * bloqueio explícito em todo módulo (ver `permissoesIniciaisBloqueadas`),
 * então pra eles a matriz é opt-in: só enxergam o que for marcado. */
export function temPermissao(
  permissoes: Record<string, boolean>,
  memberId: string,
  modulo: string,
  acao: string = "Visualizar"
): boolean {
  const key = permissaoKey(memberId, modulo, acao);
  return key in permissoes ? permissoes[key] : true;
}

/** Gera o patch que bloqueia todo módulo/ação pra um colaborador recém
 * criado — chamar ao cadastrar, assim quem cria decide explicitamente o
 * que aquele colaborador pode acessar, em vez de nascer com tudo liberado. */
export function permissoesIniciaisBloqueadas(memberId: string): Record<string, boolean> {
  const patch: Record<string, boolean> = {};
  for (const modulo of [...MODULOS_OPERACAO, ...MODULOS_GESTAO]) {
    for (const acao of ACOES) {
      patch[permissaoKey(memberId, modulo, acao)] = false;
    }
  }
  return patch;
}
