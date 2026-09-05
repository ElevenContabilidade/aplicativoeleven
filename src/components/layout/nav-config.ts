import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Building,
  Briefcase,
  UsersRound,
  Building2,
  ClipboardCheck,
  ListChecks,
  CalendarClock,
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
  Receipt,
  CreditCard,
  FileText,
  Percent,
  Handshake,
  Boxes,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: "principal" | "operacao" | "gestao";
  /** Quando presente, o item aparece dentro de um submenu recolhível em vez
   * de solto na seção — todos os itens com o mesmo `group` viram filhos de
   * um item-pai com esse nome. */
  group?: string;
}

export const NAV_GROUP_ICON: Record<string, LucideIcon> = {
  Departamentos: Boxes,
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Eleven IA", href: "/eleven-ia", icon: Sparkles, section: "principal" },
  { label: "Dados do escritório", href: "/dados-escritorio", icon: Building, section: "principal" },
  { label: "Início", href: "/dashboard", icon: LayoutGrid, section: "principal" },
  { label: "Comercial", href: "/comercial", icon: Briefcase, section: "principal" },
  { label: "Leads", href: "/leads", icon: UsersRound, section: "principal" },
  { label: "Clientes", href: "/clientes", icon: Building2, section: "principal" },
  { label: "Onboarding", href: "/onboarding", icon: ClipboardCheck, section: "principal" },

  { label: "Tarefas", href: "/tarefas", icon: ListChecks, section: "operacao" },
  { label: "Obrigações", href: "/obrigacoes", icon: CalendarClock, section: "operacao" },
  { label: "MEI", href: "/mei", icon: Percent, section: "operacao" },
  { label: "Parcelamentos", href: "/parcelamentos", icon: Receipt, section: "operacao" },
  { label: "Fiscal", href: "/fiscal", icon: Landmark, section: "operacao", group: "Departamentos" },
  { label: "Contábil", href: "/contabil", icon: Calculator, section: "operacao", group: "Departamentos" },
  { label: "Departamento Pessoal", href: "/dp", icon: UserCog, section: "operacao", group: "Departamentos" },
  { label: "Societário", href: "/societario", icon: Scale, section: "operacao", group: "Departamentos" },
  { label: "Certificados", href: "/certificados", icon: ShieldCheck, section: "operacao" },
  { label: "Documentos", href: "/documentos", icon: FolderOpen, section: "operacao" },

  { label: "Financeiro", href: "/financeiro", icon: Wallet, section: "gestao" },
  { label: "Boletos", href: "/boletos", icon: CreditCard, section: "gestao" },
  { label: "NFSe", href: "/nfse", icon: FileText, section: "gestao" },
  { label: "Faturamento", href: "/faturamento", icon: TrendingUp, section: "gestao" },
  { label: "Parceiros", href: "/parceiros", icon: Handshake, section: "gestao" },
  { label: "Portfólio", href: "/portfolio", icon: Layers, section: "gestao" },
  { label: "Atendimento", href: "/atendimento", icon: Headset, section: "gestao" },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, section: "gestao" },
  { label: "Equipe", href: "/equipe", icon: Users, section: "gestao" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, section: "gestao" },
];
