import { Badge } from "@/components/ui/badge";
import { StatusLancamento } from "@/types/financeiro";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StatusLancamento;
  className?: string;
}

const statusConfig = {
  PAGO: {
    label: "Pago",
    variant: "default" as const,
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
  ATRASADO: {
    label: "Atrasado",
    variant: "destructive" as const,
    className: "bg-red-600 hover:bg-red-700 text-white",
  },
  ABERTO: {
    label: "Aberto",
    variant: "secondary" as const,
    className: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  PARCIAL: {
    label: "Parcial",
    variant: "secondary" as const,
    className: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  PREVISTO: {
    label: "Previsto",
    variant: "outline" as const,
    className: "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ABERTO;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
