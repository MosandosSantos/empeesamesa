import { z } from "zod";

// =============================
// Enums
// =============================

export const PaymentTypeEnum = z.enum(["MONTHLY", "ANNUAL"]);
export type PaymentType = z.infer<typeof PaymentTypeEnum>;

export const PaymentMethodEnum = z.enum([
  "PIX",
  "TRANSFERENCIA",
  "DINHEIRO",
  "BOLETO",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum(["CONFIRMED", "PENDING"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const BeneficiaryEnum = z.enum(["LODGE", "POTENCY"]);
export type Beneficiary = z.infer<typeof BeneficiaryEnum>;

export const ChargeStatusEnum = z.enum(["OPEN", "PAID"]);
export type ChargeStatus = z.infer<typeof ChargeStatusEnum>;

// =============================
// Request Schemas
// =============================

// GET /api/billing/summary
export const BillingSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  type: PaymentTypeEnum,
});

export type BillingSummaryQuery = z.infer<typeof BillingSummaryQuerySchema>;

// GET /api/billing/dues/matrix
export const DuesMatrixQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  type: PaymentTypeEnum,
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  search: z.string().optional(),
});

export type DuesMatrixQuery = z.infer<typeof DuesMatrixQuerySchema>;

// POST /api/billing/payments
export const CreatePaymentSchema = z
  .object({
    memberId: z.string().uuid(),
    type: PaymentTypeEnum,
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12).optional(),
    amount: z.number().positive(),
    method: PaymentMethodEnum,
    paidAt: z.string().datetime().or(z.date()),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // MONTHLY requires month, ANNUAL doesn't allow month
      if (data.type === "MONTHLY") {
        return data.month !== undefined;
      } else {
        return data.month === undefined;
      }
    },
    {
      message: "MONTHLY type requires month, ANNUAL type must not have month",
      path: ["month"],
    }
  );

export type CreatePayment = z.infer<typeof CreatePaymentSchema>;

// GET /api/billing/payments/history
export const PaymentHistoryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  memberId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  format: z.enum(["json", "csv"]).default("json").optional(),
});

export type PaymentHistoryQuery = z.infer<typeof PaymentHistoryQuerySchema>;

// =============================
// Response Schemas
// =============================

export const BillingSummaryResponseSchema = z.object({
  expectedAmount: z.number(),
  paidAmount: z.number(),
  openAmount: z.number(),
  membersActive: z.number().int(),
  paidMembers: z.number().int(),
  delinquentMembers: z.number().int(),
});

export type BillingSummaryResponse = z.infer<
  typeof BillingSummaryResponseSchema
>;

export const DuesMatrixMemberSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  payments: z.record(z.string(), z.any()), // month/year -> payment details
});

export const DuesMatrixResponseSchema = z.object({
  members: z.array(DuesMatrixMemberSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type DuesMatrixResponse = z.infer<typeof DuesMatrixResponseSchema>;

// =============================
// Utility Functions
// =============================

export function getBeneficiaryFromType(type: PaymentType): Beneficiary {
  return type === "MONTHLY" ? "LODGE" : "POTENCY";
}

export function validateMonthForType(type: PaymentType, month?: number): boolean {
  if (type === "MONTHLY") {
    return month !== undefined && month >= 1 && month <= 12;
  } else {
    return month === undefined;
  }
}

// =============================
// Error Schemas
// =============================

export const BillingErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.any()).optional(),
  }),
});

export type BillingError = z.infer<typeof BillingErrorSchema>;

// Error codes
export const BILLING_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_PAYMENT: "DUPLICATE_PAYMENT",
  CHARGE_NOT_FOUND: "CHARGE_NOT_FOUND",
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function createBillingError(
  code: keyof typeof BILLING_ERROR_CODES,
  message: string,
  details?: any[]
): BillingError {
  return {
    error: {
      code: BILLING_ERROR_CODES[code],
      message,
      details,
    },
  };
}
