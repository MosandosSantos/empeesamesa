"use client";

import { type LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  iconClassName?: string;
};

export function KpiCard({ title, value, detail, icon: Icon, iconClassName }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
          {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        {Icon ? (
          <div className={`rounded-lg bg-muted p-3 ${iconClassName ?? "text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
