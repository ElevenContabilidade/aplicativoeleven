import { Badge } from "@/components/ui/badge";
import { toneFor } from "@/lib/status";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={toneFor(status)} className={className}>
      {status}
    </Badge>
  );
}
