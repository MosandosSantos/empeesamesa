'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Circle, X } from 'lucide-react';
import { PaymentMarkDialog } from './payment-mark-dialog';
import type { PaymentTableData, PaymentStatusInfo } from '@/types/payment-table';
import { PayStatus } from '@/lib/validations/payments';

interface PaymentTableDesktopProps {
  data: PaymentTableData;
  onPaymentUpdate: () => void;
}

interface DialogState {
  open: boolean;
  memberId: string;
  memberName: string;
  periodId: string;
  periodLabel: string;
  currentStatus?: PaymentStatusInfo;
}

export function PaymentTableDesktop({ data, onPaymentUpdate }: PaymentTableDesktopProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    memberId: '',
    memberName: '',
    periodId: '',
    periodLabel: '',
  });

  const handleCellClick = (
    memberId: string,
    memberName: string,
    periodId: string,
    periodLabel: string,
    currentStatus?: PaymentStatusInfo
  ) => {
    setDialogState({
      open: true,
      memberId,
      memberName,
      periodId,
      periodLabel,
      currentStatus,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogState((prev) => ({ ...prev, open }));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case PayStatus.PAID:
        return <Check className="h-5 w-5 text-green-600" />;
      case PayStatus.CANCELED:
        return <X className="h-5 w-5 text-red-600" />;
      case PayStatus.PENDING:
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatPeriodLabel = (period: PaymentTableData['periods'][0]) => {
    if (period.label) return period.label;
    if (period.type === 'MONTHLY' && period.month) {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthNames[period.month - 1] || `${period.month}/${period.year}`;
    }
    return period.year?.toString() || `${period.month}/${period.year}`;
  };

  if (data.members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">Nenhum membro encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] sticky left-0 bg-card z-10">Nome do Membro</TableHead>
              {data.periods.map((period) => (
                <TableHead key={period.id} className="text-center min-w-[80px]">
                  {formatPeriodLabel(period)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium sticky left-0 bg-card z-10">
                  <div>
                    <div className="font-medium">{member.nomeCompleto}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {member.situacao.toLowerCase()}
                    </div>
                  </div>
                </TableCell>
                {data.periods.map((period) => {
                  const key = `${member.id}-${period.id}`;
                  const status = data.statuses[key];
                  const periodLabel = formatPeriodLabel(period);

                  return (
                    <TableCell
                      key={period.id}
                      className="text-center cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        handleCellClick(
                          member.id,
                          member.nomeCompleto,
                          period.id,
                          periodLabel,
                          status
                        )
                      }
                    >
                      <div className="flex items-center justify-center">
                        {getStatusIcon(status?.status)}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaymentMarkDialog
        open={dialogState.open}
        onOpenChange={handleDialogClose}
        memberId={dialogState.memberId}
        memberName={dialogState.memberName}
        periodId={dialogState.periodId}
        periodLabel={dialogState.periodLabel}
        currentStatus={dialogState.currentStatus}
        onSuccess={onPaymentUpdate}
      />
    </>
  );
}
