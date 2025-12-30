import prisma from "@/lib/prisma";
import { Prisma, Decimal } from "@prisma/client";
import { PaymentType, ChargeStatus } from "@/lib/validations/billing";

/**
 * Update or create KPI snapshot for a specific period
 */
export async function updateKpiSnapshot(
  tenantId: string,
  lojaId: string,
  type: PaymentType,
  year: number,
  month?: number
) {
  // Get all charges for this period
  const charges = await prisma.duesCharge.findMany({
    where: {
      tenantId,
      lojaId,
      type,
      year,
      month: month ?? null,
    },
  });

  // Calculate aggregates
  const expectedAmount = charges.reduce(
    (sum, charge) => sum + Number(charge.expectedAmount),
    0
  );

  const paidCharges = charges.filter((c) => c.status === "PAID");
  const paidAmount = paidCharges.reduce(
    (sum, charge) => sum + Number(charge.expectedAmount),
    0
  );

  const openAmount = expectedAmount - paidAmount;

  // Get active members count
  const membersActive = await prisma.member.count({
    where: {
      tenantId,
      lojaId,
      situacao: "ATIVO",
    },
  });

  const paidMembers = paidCharges.length;
  const delinquentMembers = charges.filter((c) => c.status === "OPEN").length;

  // Upsert KPI snapshot
  await prisma.kpiSnapshot.upsert({
    where: {
      tenantId_lojaId_type_year_month: {
        tenantId,
        lojaId,
        type,
        year,
        month: month ?? null,
      },
    },
    create: {
      tenantId,
      lojaId,
      type,
      year,
      month: month ?? null,
      expectedAmount: new Decimal(expectedAmount),
      paidAmount: new Decimal(paidAmount),
      openAmount: new Decimal(openAmount),
      membersActive,
      paidMembers,
      delinquentMembers,
    },
    update: {
      expectedAmount: new Decimal(expectedAmount),
      paidAmount: new Decimal(paidAmount),
      openAmount: new Decimal(openAmount),
      membersActive,
      paidMembers,
      delinquentMembers,
    },
  });
}

/**
 * Get KPI summary for a period (from snapshot or calculated)
 */
export async function getBillingSummary(
  tenantId: string,
  lojaId: string,
  type: PaymentType,
  year: number
) {
  // Try to get from snapshot first
  const snapshot = await prisma.kpiSnapshot.findUnique({
    where: {
      tenantId_lojaId_type_year_month: {
        tenantId,
        lojaId,
        type,
        year,
        month: null, // For annual summary
      },
    },
  });

  if (snapshot && type === "ANNUAL") {
    return {
      expectedAmount: Number(snapshot.expectedAmount),
      paidAmount: Number(snapshot.paidAmount),
      openAmount: Number(snapshot.openAmount),
      membersActive: snapshot.membersActive,
      paidMembers: snapshot.paidMembers,
      delinquentMembers: snapshot.delinquentMembers,
    };
  }

  // For MONTHLY, aggregate all months
  if (type === "MONTHLY") {
    const charges = await prisma.duesCharge.findMany({
      where: {
        tenantId,
        lojaId,
        type,
        year,
      },
    });

    const expectedAmount = charges.reduce(
      (sum, charge) => sum + Number(charge.expectedAmount),
      0
    );

    const paidCharges = charges.filter((c) => c.status === "PAID");
    const paidAmount = paidCharges.reduce(
      (sum, charge) => sum + Number(charge.expectedAmount),
      0
    );

    const openAmount = expectedAmount - paidAmount;

    const membersActive = await prisma.member.count({
      where: {
        tenantId,
        lojaId,
        situacao: "ATIVO",
      },
    });

    // Calculate unique members
    const uniquePaidMembers = new Set(paidCharges.map((c) => c.memberId)).size;
    const uniqueDelinquentMembers = new Set(
      charges.filter((c) => c.status === "OPEN").map((c) => c.memberId)
    ).size;

    return {
      expectedAmount,
      paidAmount,
      openAmount,
      membersActive,
      paidMembers: uniquePaidMembers,
      delinquentMembers: uniqueDelinquentMembers,
    };
  }

  // Calculate from charges for ANNUAL
  const charges = await prisma.duesCharge.findMany({
    where: {
      tenantId,
      lojaId,
      type,
      year,
    },
  });

  const expectedAmount = charges.reduce(
    (sum, charge) => sum + Number(charge.expectedAmount),
    0
  );

  const paidCharges = charges.filter((c) => c.status === "PAID");
  const paidAmount = paidCharges.reduce(
    (sum, charge) => sum + Number(charge.expectedAmount),
    0
  );

  const openAmount = expectedAmount - paidAmount;

  const membersActive = await prisma.member.count({
    where: {
      tenantId,
      lojaId,
      situacao: "ATIVO",
    },
  });

  const paidMembers = paidCharges.length;
  const delinquentMembers = charges.filter((c) => c.status === "OPEN").length;

  return {
    expectedAmount,
    paidAmount,
    openAmount,
    membersActive,
    paidMembers,
    delinquentMembers,
  };
}

/**
 * Check if a payment already exists for a member in a period
 */
export async function checkDuplicatePayment(
  tenantId: string,
  lojaId: string,
  memberId: string,
  type: PaymentType,
  year: number,
  month?: number
): Promise<boolean> {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      tenantId,
      lojaId,
      memberId,
      type,
      year,
      month: month ?? null,
      status: "CONFIRMED",
    },
  });

  return existingPayment !== null;
}

/**
 * Generate charges for all active members for a specific period
 */
export async function generateChargesForPeriod(
  tenantId: string,
  lojaId: string,
  type: PaymentType,
  year: number,
  month: number | undefined,
  expectedAmount: number
) {
  const activeMembers = await prisma.member.findMany({
    where: {
      tenantId,
      lojaId,
      situacao: "ATIVO",
    },
    select: {
      id: true,
    },
  });

  const charges = activeMembers.map((member) => ({
    tenantId,
    lojaId,
    memberId: member.id,
    type,
    year,
    month: month ?? null,
    expectedAmount: new Decimal(expectedAmount),
    status: "OPEN" as ChargeStatus,
  }));

  // Use createMany with skipDuplicates to avoid conflicts
  const result = await prisma.duesCharge.createMany({
    data: charges,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Convert Prisma Decimal to number for JSON serialization
 */
export function decimalToNumber(value: Decimal | number): number {
  if (typeof value === "number") return value;
  return Number(value.toString());
}
