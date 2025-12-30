import { prisma } from "@/lib/prisma";

type PeriodType = "MONTHLY" | "ANNUAL" | "EVENT";
type PayStatus = "PENDING" | "PAID" | "CANCELED";

export interface PaymentPeriod {
  id: string;
  type: PeriodType;
  year: number;
  month: number | null;
  label: string | null;
}

export interface MemberInfo {
  id: string;
  name: string;
  active: boolean;
}

export interface PaymentStatusInfo {
  status: PayStatus;
  paidAt: Date | null;
  method: string | null;
  amount: number | null;
  notes: string | null;
}

export interface PaymentsTableData {
  members: MemberInfo[];
  periods: PaymentPeriod[];
  statuses: Record<string, PaymentStatusInfo>; // key: "memberId-periodId"
}

export interface MarkPaymentInput {
  tenantId: string;
  memberId: string;
  periodId: string;
  status: PayStatus;
  amount?: number;
  method?: string;
  paidAt?: Date;
  notes?: string;
  actorUserId?: string;
}

/**
 * Garante que os períodos mensais do ano especificado existam
 */
export async function ensureMonthlyPeriods(
  tenantId: string,
  year: number
): Promise<PaymentPeriod[]> {
  const periods: PaymentPeriod[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthNames = [
      "jan", "fev", "mar", "abr", "mai", "jun",
      "jul", "ago", "set", "out", "nov", "dez"
    ];
    const label = `Mensalidade ${monthNames[month - 1]}/${year}`;

    const period = await prisma.paymentPeriod.upsert({
      where: {
        tenantId_type_year_month_eventId: {
          tenantId,
          type: "MONTHLY",
          year,
          month,
          eventId: null,
        },
      },
      update: {},
      create: {
        tenantId,
        type: "MONTHLY",
        year,
        month,
        label,
      },
    });

    periods.push({
      id: period.id,
      type: period.type as PeriodType,
      year: period.year,
      month: period.month,
      label: period.label,
    });
  }

  return periods;
}

/**
 * Garante que os períodos anuais existam (ano atual + próximos N anos)
 */
export async function ensureAnnualPeriods(
  tenantId: string,
  startYear: number,
  count: number = 6
): Promise<PaymentPeriod[]> {
  const periods: PaymentPeriod[] = [];

  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    const label = `Anuidade ${year}`;

    const period = await prisma.paymentPeriod.upsert({
      where: {
        tenantId_type_year_month_eventId: {
          tenantId,
          type: "ANNUAL",
          year,
          month: null,
          eventId: null,
        },
      },
      update: {},
      create: {
        tenantId,
        type: "ANNUAL",
        year,
        label,
      },
    });

    periods.push({
      id: period.id,
      type: period.type as PeriodType,
      year: period.year,
      month: period.month,
      label: period.label,
    });
  }

  return periods;
}

/**
 * Obtém os dados da tabela de pagamentos
 */
export async function getPaymentsTable(
  tenantId: string,
  type: PeriodType,
  memberId?: string // Se fornecido, filtra para apenas um membro
): Promise<PaymentsTableData> {
  // 1. Garantir que os períodos existam
  let periods: PaymentPeriod[];
  const currentYear = new Date().getFullYear();

  if (type === "MONTHLY") {
    periods = await ensureMonthlyPeriods(tenantId, currentYear);
  } else if (type === "ANNUAL") {
    periods = await ensureAnnualPeriods(tenantId, currentYear, 6);
  } else {
    // EVENT - por enquanto retorna vazio
    periods = [];
  }

  // 2. Buscar membros (filtrar por memberId se fornecido)
  const whereClause: any = {
    tenantId,
    situacao: "ATIVO",
  };

  if (memberId) {
    whereClause.id = memberId;
  }

  const members = await prisma.member.findMany({
    where: whereClause,
    select: {
      id: true,
      nomeCompleto: true,
      situacao: true,
    },
    orderBy: {
      nomeCompleto: "asc",
    },
  });

  const memberInfos: MemberInfo[] = members.map((m) => ({
    id: m.id,
    name: m.nomeCompleto,
    active: m.situacao === "ATIVO",
  }));

  // 3. Buscar todos os status de pagamento para esses membros e períodos
  const periodIds = periods.map((p) => p.id);
  const memberIds = members.map((m) => m.id);

  const paymentStatuses = await prisma.paymentStatus.findMany({
    where: {
      tenantId,
      periodId: { in: periodIds },
      memberId: { in: memberIds },
    },
  });

  // 4. Montar o mapa de status
  const statusMap: Record<string, PaymentStatusInfo> = {};

  for (const ps of paymentStatuses) {
    const key = `${ps.memberId}-${ps.periodId}`;
    statusMap[key] = {
      status: ps.status as PayStatus,
      paidAt: ps.paidAt,
      method: ps.method,
      amount: ps.amount,
      notes: ps.notes,
    };
  }

  return {
    members: memberInfos,
    periods,
    statuses: statusMap,
  };
}

/**
 * Marca um pagamento (cria/atualiza status e gera audit log)
 */
export async function markPayment(input: MarkPaymentInput): Promise<void> {
  const {
    tenantId,
    memberId,
    periodId,
    status,
    amount,
    method,
    paidAt,
    notes,
    actorUserId,
  } = input;

  await prisma.$transaction(async (tx) => {
    // 1. Buscar o status atual (se existir)
    const currentStatus = await tx.paymentStatus.findUnique({
      where: {
        tenantId_memberId_periodId: {
          tenantId,
          memberId,
          periodId,
        },
      },
    });

    const before = currentStatus
      ? {
          status: currentStatus.status,
          amount: currentStatus.amount,
          method: currentStatus.method,
          paidAt: currentStatus.paidAt?.toISOString(),
          notes: currentStatus.notes,
        }
      : null;

    // 2. Upsert do status
    const newStatus = await tx.paymentStatus.upsert({
      where: {
        tenantId_memberId_periodId: {
          tenantId,
          memberId,
          periodId,
        },
      },
      update: {
        status,
        amount,
        method,
        paidAt,
        notes,
        updatedById: actorUserId,
      },
      create: {
        tenantId,
        memberId,
        periodId,
        status,
        amount,
        method,
        paidAt,
        notes,
        updatedById: actorUserId,
      },
    });

    const after = {
      status: newStatus.status,
      amount: newStatus.amount,
      method: newStatus.method,
      paidAt: newStatus.paidAt?.toISOString(),
      notes: newStatus.notes,
    };

    // 3. Gravar audit log
    const action = !currentStatus
      ? "CREATE"
      : status === "PAID"
      ? "MARK_PAID"
      : status === "PENDING"
      ? "MARK_PENDING"
      : status === "CANCELED"
      ? "CANCEL"
      : "EDIT_META";

    await tx.paymentAuditLog.create({
      data: {
        tenantId,
        memberId,
        periodId,
        action,
        before: before ? JSON.stringify(before) : null,
        after: JSON.stringify(after),
        actorUserId,
      },
    });
  });
}
