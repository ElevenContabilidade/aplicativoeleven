import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Briefcase,
  UsersRound,
  Building2,
  ClipboardCheck,
  ListChecks,
  Landmark,
  Calculator,
  UserCog,
  Scale,
  ShieldCheck,
  FolderOpen,
  Wallet,
  Headset,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  Layers,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: "principal" | "operacao" | "gestao";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutGrid, section: "principal" },
  { label: "Comercial", href: "/comercial", icon: Briefcase, section: "principal" },
  { label: "Leads", href: "/leads", icon: UsersRound, section: "principal" },
  { label: "Clientes", href: "/clientes", icon: Building2, section: "principal" },
  { label: "Onboarding", href: "/onboarding", icon: ClipboardCheck, section: "principal" },

  { label: "Tarefas", href: "/tarefas", icon: ListChecks, section: "operacao" },
  { label: "Fiscal", href: "/fiscal", icon: Landmark, section: "operacao" },
  { label: "Contábil", href: "/contabil", icon: Calculator, section: "operacao" },
  { label: "Departamento Pessoal", href: "/dp", icon: UserCog, section: "operacao" },
  { label: "Societário", href: "/societario", icon: Scale, section: "operacao" },
  { label: "Certificados", href: "/certificados", icon: ShieldCheck, section: "operacao" },
  { label: "Documentos", href: "/documentos", icon: FolderOpen, section: "operacao" },

  { label: "Financeiro", href: "/financeiro", icon: Wallet, section: "gestao" },
  { label: "Portfólio", href: "/portfolio", icon: Layers, section: "gestao" },
  { label: "Atendimento", href: "/atendimento", icon: Headset, section: "gestao" },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, section: "gestao" },
  { label: "Equipe", href: "/equipe", icon: Users, section: "gestao" },
  { label: "Eleven IA", href: "/eleven-ia", icon: Sparkles, section: "gestao" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, section: "gestao" },
];
