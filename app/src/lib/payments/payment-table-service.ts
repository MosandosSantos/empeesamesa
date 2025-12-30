import { prisma } from '@/lib/prisma';
import { PaymentType } from '@/types/pagamento-membro';
import type { PaymentTableData, PaymentPeriod, PaymentStatus } from '@/types/payment-table';
import { MonthNames } from '@/types/pagamento-membro';

/**
 * Gera os períodos mensais do ano corrente (virtual, não salvos no BD)
 */
export function generateMonthlyPeriods(year: number): PaymentPeriod[] {
  const periods: PaymentPeriod[] = [];
  for (let month = 1; month <= 12; month++) {
    periods.push({
      id: `MONTHLY-${year}-${month}`,
      type: PaymentType.MENSALIDADE_LOJA,
      year,
      month,
      label: `${MonthNames[month]}/${year}`,
    });
  }
  return periods;
}

/**
 * Gera os períodos anuais (ano atual + próximos 5)
 */
export function generateAnnualPeriods(startYear: number, count: number = 6): PaymentPeriod[] {
  const periods: PaymentPeriod[] = [];
  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    periods.push({
      id: `ANNUAL-${year}`,
      type: PaymentType.ANUIDADE_PRIORADO,
      year,
      label: year.toString(),
    });
  }
  return periods;
}

/**
 * Busca dados da tabela de pagamentos (membros + períodos + statuses)
 */
export async function getPaymentTable(
  tenantId: string,
  type: 'MONTHLY' | 'ANNUAL',
  options?: {
    memberId?: string; // para filtrar apenas um membro (MEMBER role)
  }
): Promise<PaymentTableData> {
  const currentYear = new Date().getFullYear();

  // 1. Gerar períodos virtuais
  const periods =
    type === 'MONTHLY'
      ? generateMonthlyPeriods(currentYear)
      : generateAnnualPeriods(currentYear, 6);

  // 2. Buscar membros (com filtro se MEMBER role)
  const whereClause: any = {
    tenantId,
    situacao: 'ATIVO', // só membros ativos
  };
  if (options?.memberId) {
    whereClause.id = options.memberId;
  }

  const members = await prisma.member.findMany({
    where: whereClause,
    select: {
      id: true,
      nomeCompleto: true,
      situacao: true,
    },
    orderBy: {
      nomeCompleto: 'asc',
    },
  });

  // 3. Buscar todos os MemberPayments relevantes (do tipo e períodos)
  const paymentType =
    type === 'MONTHLY' ? PaymentType.MENSALIDADE_LOJA : PaymentType.ANUIDADE_PRIORADO;

  const wherePayments: any = {
    tenantId,
    paymentType,
  };

  if (type === 'MONTHLY') {
    wherePayments.referenceYear = currentYear;
  } else {
    // ANNUAL: anos entre currentYear e currentYear+5
    wherePayments.referenceYear = {
      gte: currentYear,
      lte: currentYear + 5,
    };
  }

  if (options?.memberId) {
    wherePayments.memberId = options.memberId;
  }

  const memberPayments = await prisma.memberPayment.findMany({
    where: wherePayments,
    select: {
      id: true,
      memberId: true,
      paymentType: true,
      referenceMonth: true,
      referenceYear: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true,
    },
  });

  // 4. Montar matriz de status (member x period)
  const statuses: Record<string, PaymentStatus> = {};

  for (const member of members) {
    for (const period of periods) {
      const key = `${member.id}-${period.id}`;

      // Procurar se existe MemberPayment para este membro/período
      const payment = memberPayments.find((p) => {
        if (p.memberId !== member.id) return false;
        if (p.paymentType !== period.type) return false;
        if (p.referenceYear !== period.year) return false;
        if (period.month && p.referenceMonth !== period.month) return false;
        return true;
      });

      if (payment) {
        statuses[key] = {
          memberId: member.id,
          periodId: period.id,
          status: 'PAID',
          memberPaymentId: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod as any,
          paidAt: payment.paymentDate,
        };
      } else {
        statuses[key] = {
          memberId: member.id,
          periodId: period.id,
          status: 'PENDING',
        };
      }
    }
  }

  return {
    members: members.map((m) => ({
      id: m.id,
      nomeCompleto: m.nomeCompleto,
      active: m.situacao === 'ATIVO',
    })),
    periods,
    statuses,
  };
}
