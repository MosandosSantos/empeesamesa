/**
 * Payment Aggregator - Sprint Pagamentos
 *
 * Agrega dados de MemberPayment para criar grid de acompanhamento de pagamentos.
 * Sistema determina status PAGO/PENDENTE por período baseado em pagamentos registrados.
 */

import { prisma } from '@/lib/prisma';
import { generateMonthlyPeriods, generateAnnualPeriods, MonthlyPeriod, AnnualPeriod } from './period-generator';

export interface MemberSummary {
  id: string;
  nomeCompleto: string;
  situacao: string;
  class: string | null;
}

export interface PaymentStatus {
  isPaid: boolean;
  paymentId?: string;
  amount?: number;
  paymentMethod?: string;
  paymentDate?: string;
  description?: string;
}

export interface PaymentGridData {
  members: MemberSummary[];
  periods: (MonthlyPeriod | AnnualPeriod)[];
  statuses: Record<string, PaymentStatus>;  // key: "memberId-periodId"
  mensalidadeCategoriaId?: string;  // Para criar novos pagamentos
}

interface GetPaymentGridParams {
  tenantId: string;
  type: 'MONTHLY' | 'ANNUAL';
  year?: number;
  lojaId?: string;
  onlyMemberId?: string;  // Para MEMBER role (restringe a apenas 1 membro)
}

/**
 * Busca e agrega dados de pagamentos para montar grid de acompanhamento
 *
 * Performance: 3 queries total (members, payments, categoria)
 * Agregação in-memory (eficiente para ~50 membros x 12 meses = 600 cells)
 */
export async function getPaymentGrid(params: GetPaymentGridParams): Promise<PaymentGridData> {
  const { tenantId, type, year, lojaId, onlyMemberId } = params;
  const currentYear = year || new Date().getFullYear();

  // 1. Buscar membros
  const members = await prisma.member.findMany({
    where: {
      tenantId,
      ...(lojaId && { lojaId }),
      ...(onlyMemberId && { id: onlyMemberId }),
      situacao: 'ATIVO',
    },
    select: {
      id: true,
      nomeCompleto: true,
      situacao: true,
      class: true,
    },
    orderBy: {
      nomeCompleto: 'asc',
    },
  });

  // 2. Gerar períodos (sem banco de dados)
  const periods = type === 'MONTHLY'
    ? generateMonthlyPeriods(currentYear)
    : generateAnnualPeriods(currentYear);

  // 3. Buscar pagamentos relevantes (single query)
  const memberIds = members.map(m => m.id);
  const relevantYears = type === 'MONTHLY'
    ? [currentYear]
    : Array.from({ length: 6 }, (_, i) => currentYear + i);

  const payments = memberIds.length > 0 ? await prisma.memberPayment.findMany({
    where: {
      tenantId,
      memberId: { in: memberIds },
      paymentType: type === 'MONTHLY' ? 'MENSALIDADE_LOJA' : 'ANUIDADE_PRIORADO',
      referenceYear: { in: relevantYears },
    },
    select: {
      id: true,
      memberId: true,
      referenceYear: true,
      referenceMonth: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true,
      description: true,
    },
  }) : [];

  // 4. Montar mapa de status (agregação in-memory)
  const statuses: Record<string, PaymentStatus> = {};
  const paymentMap = new Map<string, { amount: number; latestDate?: string }>();

  for (const payment of payments) {
    const periodKey = type === 'MONTHLY'
      ? `${payment.memberId}-${payment.referenceYear}-${String(payment.referenceMonth ?? 0).padStart(2, '0')}`
      : `${payment.memberId}-${payment.referenceYear}`;
    const existing = paymentMap.get(periodKey);
    const amount = (existing?.amount ?? 0) + (payment.amount ?? 0);
    const latestDate = payment.paymentDate
      ? payment.paymentDate.toISOString()
      : existing?.latestDate;

    paymentMap.set(periodKey, { amount, latestDate });
  }

  for (const member of members) {
    for (const period of periods) {
      const key = `${member.id}-${period.id}`;
      const periodKey = type === 'MONTHLY' && 'month' in period
        ? `${member.id}-${period.year}-${String(period.month).padStart(2, '0')}`
        : `${member.id}-${period.year}`;
      const aggregate = paymentMap.get(periodKey);

      statuses[key] = aggregate
        ? {
            isPaid: aggregate.amount > 0,
            amount: aggregate.amount,
            paymentDate: aggregate.latestDate,
          }
        : {
            isPaid: false,
          };
    }
  }

  // 5. Buscar categoria "Mensalidades" (para criar novos pagamentos)
  const mensalidadeCategoria = await prisma.categoria.findFirst({
    where: {
      tenantId,
      nome: { contains: 'Mensalidade' },
    },
    select: { id: true },
  });

  return {
    members,
    periods,
    statuses,
    mensalidadeCategoriaId: mensalidadeCategoria?.id,
  };
}
