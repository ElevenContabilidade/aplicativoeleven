import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger" | "wine";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-sand-100 text-sand-600",
    success: "bg-status-success-bg text-status-success",
    warning: "bg-status-warning-bg text-status-warning",
    danger: "bg-status-danger-bg text-status-danger",
    wine: "bg-wine-100 text-wine-700",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium leading-tight text-sand-500">{label}</p>
          {Icon && (
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
              <Icon className="size-3.5" />
            </span>
          )}
        </div>
        <p className="mt-2 font-display text-2xl font-semibold text-sand-900">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-sand-400">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold text-sand-900">{title}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
      </CardContent>
    </Card>
  );
}
