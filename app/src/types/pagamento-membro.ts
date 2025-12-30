/**
 * Type definitions for Member Payment System
 * Defines payment types, validation helpers, and labels for member payments
 */

// Payment Type Constants
export const PaymentType = {
  MENSALIDADE_LOJA: "MENSALIDADE_LOJA",
  ANUIDADE_PRIORADO: "ANUIDADE_PRIORADO",
  EVENTO: "EVENTO",
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

// Payment Type Labels (Portuguese)
export const PaymentTypeLabels: Record<PaymentType, string> = {
  MENSALIDADE_LOJA: "Mensalidade Loja",
  ANUIDADE_PRIORADO: "Anuidade Priorado",
  EVENTO: "Evento",
};

// Category names for auto-creation in Categoria table
export const PaymentTypeCategories: Record<PaymentType, string> = {
  MENSALIDADE_LOJA: "Mensalidades",
  ANUIDADE_PRIORADO: "Anuidade Priorado",
  EVENTO: "Eventos",
};

// Payment Method Constants (aligns with FormaPagamento in financeiro.ts)
export const PaymentMethod = {
  PIX: "PIX",
  TRANSFERENCIA: "TRANSFERENCIA",
  BOLETO: "BOLETO",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Payment Method Labels
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: "PIX",
  TRANSFERENCIA: "Transferência Bancária",
  BOLETO: "Boleto",
};

// Type Guards
export const isValidPaymentType = (value: string): value is PaymentType => {
  return Object.values(PaymentType).includes(value as PaymentType);
};

export const isValidPaymentMethod = (value: string): value is PaymentMethod => {
  return Object.values(PaymentMethod).includes(value as PaymentMethod);
};

// Month names for reference month selection
export const MonthNames: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

// Helper to generate month options for select dropdown
export const getMonthOptions = (): Array<{ value: number; label: string }> => {
  return Object.entries(MonthNames).map(([value, label]) => ({
    value: parseInt(value, 10),
    label,
  }));
};

// Helper to generate year options (current year ± 2)
export const getYearOptions = (): Array<{ value: number; label: string }> => {
  const currentYear = new Date().getFullYear();
  const years: Array<{ value: number; label: string }> = [];

  for (let i = -2; i <= 2; i++) {
    const year = currentYear + i;
    years.push({ value: year, label: year.toString() });
  }

  return years;
};

// Interface for member payment creation
export interface MemberPaymentCreateInput {
  memberId: string;
  paymentType: PaymentType;
  referenceMonth?: number; // 1-12, required for MENSALIDADE_LOJA
  referenceYear?: number; // YYYY, required for MENSALIDADE_LOJA and ANUIDADE_PRIORADO
  description?: string; // Optional, will be auto-generated if not provided
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO date string (YYYY-MM-DD)
}

// Interface for member payment response
export interface MemberPaymentResponse {
  id: string;
  tenantId: string;
  memberId: string;
  lancamentoId: string;
  paymentType: PaymentType;
  referenceMonth: number | null;
  referenceYear: number | null;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    nomeCompleto: string;
  };
  lancamento?: {
    id: string;
    tipo: string;
    status: string;
  };
}
