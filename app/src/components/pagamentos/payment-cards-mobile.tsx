'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, X } from 'lucide-react';
import { PaymentMarkDialog } from './payment-mark-dialog';
import type { PaymentTableData, PaymentStatusInfo } from '@/types/payment-table';
import { PayStatus } from '@/lib/validations/payments';
import { cn } from '@/lib/utils';

interface PaymentCardsMobileProps {
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

export function PaymentCardsMobile({ data, onPaymentUpdate }: PaymentCardsMobileProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    memberId: '',
    memberName: '',
    periodId: '',
    periodLabel: '',
  });

  const handleChipClick = (
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
        return <Check className="h-3.5 w-3.5" />;
      case PayStatus.CANCELED:
        return <X className="h-3.5 w-3.5" />;
      case PayStatus.PENDING:
      default:
        return <Circle className="h-3.5 w-3.5" />;
    }
  };

  const getChipStyles = (status?: string) => {
    switch (status) {
      case PayStatus.PAID:
        return 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200';
      case PayStatus.CANCELED:
        return 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200';
      case PayStatus.PENDING:
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100';
    }
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
      <div className="space-y-3">
        {data.members.map((member) => {
          // Count paid, pending, and canceled
          const memberStatuses = data.periods.map(
            (period) => data.statuses[`${member.id}-${period.id}`]
          );
          const paidCount = memberStatuses.filter((s) => s?.status === PayStatus.PAID).length;
          const pendingCount = memberStatuses.filter((s) => s?.status === PayStatus.PENDING).length;
          const canceledCount = memberStatuses.filter((s) => s?.status === PayStatus.CANCELED).length;

          return (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start justify-between gap-2">
                  <div>
                    <div>{member.nomeCompleto}</div>
                    <div className="text-xs font-normal text-muted-foreground capitalize mt-0.5">
                      {member.situacao.toLowerCase()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-normal">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {paidCount} Pagos
                    </Badge>
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {pendingCount} Pendentes
                      </Badge>
                    )}
                    {canceledCount > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {canceledCount} Cancelados
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {data.periods.map((period) => {
                    const key = `${member.id}-${period.id}`;
                    const status = data.statuses[key];
                    const periodLabel = period.label || `${period.month}/${period.year}`;

                    return (
                      <button
                        key={period.id}
                        onClick={() =>
                          handleChipClick(
                            member.id,
                            member.nomeCompleto,
                            period.id,
                            periodLabel,
                            status
                          )
                        }
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-colors whitespace-nowrap',
                          'min-w-fit flex-shrink-0',
                          getChipStyles(status?.status)
                        )}
                      >
                        {getStatusIcon(status?.status)}
                        <span className="text-sm font-medium">{periodLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
