import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "YYYY-MM-DD" (sem horário) — usado em vencimento, início de contrato,
 * data de abertura etc. `new Date("YYYY-MM-DD")` interpreta isso como meia-
 * noite em UTC; num fuso atrás de UTC (todo o Brasil) isso já é o dia
 * anterior lá, então exibiria uma data errada. Monta a data pelos
 * componentes, no fuso local, pra não sofrer esse deslocamento. */
const DATA_SEM_HORARIO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(value: string | Date) {
  if (typeof value === "string" && DATA_SEM_HORARIO_RE.test(value)) {
    const [ano, mes, dia] = value.split("-").map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
  }
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
