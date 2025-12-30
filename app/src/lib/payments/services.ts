import { prisma } from "@/lib/prisma";
import { PeriodType, PayStatus, AuditAction } from "@/lib/validations/payments";
import type { MarkPaymentInput } from "@/lib/validations/payments";

// =============================
// Tipos auxiliares
// =============================

export interface PaymentPeriodInfo {
  id: string;
  type: string;
  year: number;
  month: number | null;
  label: string | null;
}

export interface MemberInfo {
  id: string;
  nomeCompleto: string;
  situacao: string;
}

export interface PaymentStatusInfo {
  memberId: string;
  periodId: string;
  status: string;
  amount: number | null;
  method: string | null;
  paidAt: Date | null;
  notes: string | null;
}

export interface PaymentsTableData {
  members: MemberInfo[];
  periods: PaymentPeriodInfo[];
  statuses: PaymentStatusInfo[];
}

// =============================
// Ensure Periods (garantir que períodos existam)
// =============================

/**
 * Garante que os 12 períodos mensais do ano especificado existam
 */
export async function ensureMonthlyPeriods(
  tenantId: string,
  year: number
): Promise<PaymentPeriodInfo[]> {
  const periods: PaymentPeriodInfo[] = [];
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  for (let month = 1; month <= 12; month++) {
    const period = await prisma.paymentPeriod.upsert({
      where: {
        tenantId_type_year_month_eventId: {
          tenantId,
          type: PeriodType.MONTHLY,
          year,
          month,
          eventId: null,
        },
      },
      update: {},
      create: {
        tenantId,
        type: PeriodType.MONTHLY,
        year,
        month,
        eventId: null,
        label: `Mensalidade ${monthNames[month - 1]}/${year}`,
      },
    });
    periods.push(period);
  }

  return periods;
}

/**
 * Garante que os próximos N anos de anuidade existam
 */
export async function ensureAnnualPeriods(
  tenantId: string,
  startYear: number,
  count: number = 6
): Promise<PaymentPeriodInfo[]> {
  const periods: PaymentPeriodInfo[] = [];

  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    const period = await prisma.paymentPeriod.upsert({
      where: {
        tenantId_type_year_month_eventId: {
          tenantId,
          type: PeriodType.ANNUAL,
          year,
          month: null,
          eventId: null,
        },
      },
      update: {},
      create: {
        tenantId,
        type: PeriodType.ANNUAL,
        year,
        month: null,
        eventId: null,
        label: `Anuidade ${year}`,
      },
    });
    periods.push(period);
  }

  return periods;
}

// =============================
// Get Payments Table
// =============================

/**
 * Retorna dados estruturados para a tabela de pagamentos
 */
export async function getPaymentsTable(
  tenantId: string,
  type: string,
  options: {
    memberId?: string; // Para filtrar apenas um membro
  } = {}
): Promise<PaymentsTableData> {
  // Garantir que os períodos existam antes de buscar
  const currentYear = new Date().getFullYear();

  if (type === PeriodType.MONTHLY) {
    await ensureMonthlyPeriods(tenantId, currentYear);
  } else if (type === PeriodType.ANNUAL) {
    await ensureAnnualPeriods(tenantId, currentYear, 6);
  }

  // Buscar membros ativos
  const memberWhere: any = {
    tenantId,
    situacao: "ATIVO",
  };

  if (options.memberId) {
    memberWhere.id = options.memberId;
  }

  const members = await prisma.member.findMany({
    where: memberWhere,
    select: {
      id: true,
      nomeCompleto: true,
      situacao: true,
    },
    orderBy: {
      nomeCompleto: "asc",
    },
  });

  // Buscar períodos do tipo especificado
  const periodWhere: any = {
    tenantId,
    type,
  };

  if (type === PeriodType.MONTHLY) {
    periodWhere.year = currentYear;
  } else if (type === PeriodType.ANNUAL) {
    periodWhere.year = {
      gte: currentYear,
      lte: currentYear + 5,
    };
  }

  const periods = await prisma.paymentPeriod.findMany({
    where: periodWhere,
    orderBy: [
      { year: "asc" },
      { month: "asc" },
    ],
  });

  // Buscar status de pagamentos
  const statuses = await prisma.paymentStatus.findMany({
    where: {
      tenantId,
      periodId: {
        in: periods.map((p) => p.id),
      },
      ...(options.memberId && { memberId: options.memberId }),
    },
    select: {
      memberId: true,
      periodId: true,
      status: true,
      amount: true,
      method: true,
      paidAt: true,
      notes: true,
    },
  });

  return {
    members,
    periods,
    statuses,
  };
}

// =============================
// Mark Payment
// =============================

/**
 * Marca/atualiza o status de um pagamento
 */
export async function markPayment(
  tenantId: string,
  input: MarkPaymentInput,
  actorUserId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Buscar status anterior (se existir)
    const previousStatus = await tx.paymentStatus.findUnique({
      where: {
        tenantId_memberId_periodId: {
          tenantId,
          memberId: input.memberId,
          periodId: input.periodId,
        },
      },
    });

    // Preparar dados para o novo status
    const newStatus = {
      tenantId,
      memberId: input.memberId,
      periodId: input.periodId,
      status: input.status,
      amount: input.amount ?? null,
      method: input.method ?? null,
      paidAt: input.paidAt ? new Date(input.paidAt) : null,
      notes: input.notes ?? null,
      updatedById: actorUserId,
    };

    // Upsert do status
    await tx.paymentStatus.upsert({
      where: {
        tenantId_memberId_periodId: {
          tenantId,
          memberId: input.memberId,
          periodId: input.periodId,
        },
      },
      update: newStatus,
      create: newStatus,
    });

    // Determinar ação do audit log
    let action: string;
    if (!previousStatus) {
      action = input.status === PayStatus.PAID
        ? AuditAction.MARK_PAID
        : AuditAction.MARK_PENDING;
    } else if (previousStatus.status !== input.status) {
      if (input.status === PayStatus.PAID) {
        action = AuditAction.MARK_PAID;
      } else if (input.status === PayStatus.CANCELED) {
        action = AuditAction.CANCEL;
      } else {
        action = AuditAction.MARK_PENDING;
      }
    } else {
      action = AuditAction.EDIT_META;
    }

    // Gravar audit log
    await tx.paymentAuditLog.create({
      data: {
        tenantId,
        memberId: input.memberId,
        periodId: input.periodId,
        action,
        before: previousStatus ? JSON.stringify(previousStatus) : null,
        after: JSON.stringify(newStatus),
        actorUserId,
      },
    });
  });
}

// =============================
// Helpers
// =============================

/**
 * Busca um status de pagamento específico
 */
export async function getPaymentStatus(
  tenantId: string,
  memberId: string,
  periodId: string
): Promise<PaymentStatusInfo | null> {
  return await prisma.paymentStatus.findUnique({
    where: {
      tenantId_memberId_periodId: {
        tenantId,
        memberId,
        periodId,
      },
    },
    select: {
      memberId: true,
      periodId: true,
      status: true,
      amount: true,
      method: true,
      paidAt: true,
      notes: true,
    },
  });
}

/**
 * Busca o histórico de audit log de um pagamento
 */
export async function getPaymentAuditLog(
  tenantId: string,
  memberId: string,
  periodId: string
) {
  return await prisma.paymentAuditLog.findMany({
    where: {
      tenantId,
      memberId,
      periodId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
