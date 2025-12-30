"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";

interface PaymentMatrixData {
  members: Array<{
    id: string;
    name: string;
  }>;
  periods: Array<{
    id: string;
    label: string;
  }>;
  statuses: Record<string, 'PAID' | 'PENDING'>;
}

interface PaymentMatrixChartProps {
  data: PaymentMatrixData;
}

export function PaymentMatrixChart({ data }: PaymentMatrixChartProps) {
  const getStatusBadge = (status: 'PAID' | 'PENDING') => {
    if (status === 'PAID') {
      return (
        <div className="flex items-center justify-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Pago</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-1 text-yellow-600">
        <XCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Pendente</span>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold sticky left-0 bg-background z-10 min-w-[200px]">
              Membros
            </TableHead>
            {data.periods.map((period) => (
              <TableHead key={period.id} className="text-center min-w-[100px]">
                {period.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium sticky left-0 bg-background z-10">
                {member.name}
              </TableCell>
              {data.periods.map((period) => {
                const status = data.statuses[`${member.id}-${period.id}`];
                return (
                  <TableCell key={`${member.id}-${period.id}`} className="text-center">
                    {getStatusBadge(status)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
