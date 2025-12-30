"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type MinimumStockCardProps = {
  title: string;
  description: string;
  value: number | string;
  unit?: string;
  showAlert?: boolean;
  alertText?: string;
};

export function MinimumStockCard({
  title,
  description,
  value,
  unit,
  showAlert = false,
  alertText = "Abaixo do minimo",
}: MinimumStockCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {value} {unit ?? ""}
        </div>
        {showAlert && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {alertText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
