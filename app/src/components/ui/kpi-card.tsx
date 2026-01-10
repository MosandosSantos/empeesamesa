"use client";

import { type LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  detailClassName?: string;
  icon?: LucideIcon;
};

export function KpiCard({
  title,
  value,
  detail,
  detailClassName,
  icon: Icon,
}: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-900">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-emerald-900">{value}</p>
          {detail ? (
            <p className={detailClassName ?? "text-xs font-semibold text-emerald-600"}>{detail}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-muted p-3 text-emerald-700 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
