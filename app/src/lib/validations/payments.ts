import { z } from "zod";

// =============================
// Constantes
// =============================

export const PeriodType = {
  MONTHLY: "MONTHLY",
  ANNUAL: "ANNUAL",
  EVENT: "EVENT",
} as const;

export const PayStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELED: "CANCELED",
} as const;

export const PaymentMethod = {
  PIX: "PIX",
  DINHEIRO: "DINHEIRO",
  TRANSFERENCIA: "TRANSFERENCIA",
  BOLETO: "BOLETO",
  CARTAO: "CARTAO",
  CONVENIO: "CONVENIO",
} as const;

export const AuditAction = {
  MARK_PAID: "MARK_PAID",
  MARK_PENDING: "MARK_PENDING",
  EDIT_META: "EDIT_META",
  CANCEL: "CANCEL",
} as const;

// =============================
// Types
// =============================

export type PeriodType = (typeof PeriodType)[keyof typeof PeriodType];
export type PayStatus = (typeof PayStatus)[keyof typeof PayStatus];
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// =============================
// Schemas Zod
// =============================

export const periodTypeSchema = z.enum([
  PeriodType.MONTHLY,
  PeriodType.ANNUAL,
  PeriodType.EVENT,
]);

export const payStatusSchema = z.enum([
  PayStatus.PENDING,
  PayStatus.PAID,
  PayStatus.CANCELED,
]);

export const paymentMethodSchema = z.enum([
  PaymentMethod.PIX,
  PaymentMethod.DINHEIRO,
  PaymentMethod.TRANSFERENCIA,
  PaymentMethod.BOLETO,
  PaymentMethod.CARTAO,
  PaymentMethod.CONVENIO,
]);

// Schema para marcar pagamento
export const markPaymentSchema = z.object({
  memberId: z.string().uuid(),
  periodId: z.string().uuid(),
  status: payStatusSchema,
  amount: z.number().optional(),
  method: paymentMethodSchema.optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type MarkPaymentInput = z.infer<typeof markPaymentSchema>;

// Schema para query de tabela
export const paymentTableQuerySchema = z.object({
  type: periodTypeSchema,
  tenantId: z.string().uuid().optional(), // Apenas para SYS_ADMIN
});

export type PaymentTableQuery = z.infer<typeof paymentTableQuerySchema>;

// Schema para criar períodos
export const ensurePeriodsSchema = z.object({
  tenantId: z.string().uuid(),
  type: periodTypeSchema,
  year: z.number().int().min(2020).max(2100),
  count: z.number().int().min(1).max(12).optional(), // Para MONTHLY (default 12) ou ANNUAL (default 6)
});

export type EnsurePeriodsInput = z.infer<typeof ensurePeriodsSchema>;
