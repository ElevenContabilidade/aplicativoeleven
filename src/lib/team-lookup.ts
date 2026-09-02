import { useAppStore } from "@/lib/store/app-store";

/** Busca pelo colaborador na lista REAL (store, com quem foi cadastrado
 * depois do seed) em vez da lista fixa de exemplo — usado fora de
 * componentes React (handlers, ordenação), por isso lê `getState()` em vez
 * de usar o hook. */
export function teamName(id: string) {
  return useAppStore.getState().team.find((t) => t.id === id)?.nome ?? "—";
}
export function teamMember(id: string) {
  return useAppStore.getState().team.find((t) => t.id === id);
}
