import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  value: number;
  className?: string;
  showSign?: boolean;
  colorize?: boolean;
}

export function CurrencyDisplay({
  value,
  className,
  showSign = false,
  colorize = false,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const displayValue = showSign && sign ? `${sign} ${formatted}` : formatted;

  const colorClass = colorize
    ? value > 0
      ? "text-green-600 dark:text-green-400"
      : value < 0
      ? "text-red-600 dark:text-red-400"
      : "text-gray-600 dark:text-gray-400"
    : "";

  return (
    <span className={cn(colorClass, className)}>
      {displayValue}
    </span>
  );
}
