/**
 * Type definitions for Sprint 6 - Accounts Payable and Receivable
 * Since SQLite doesn't support enums, we define them as TypeScript types
 */

export const TipoLancamento = {
  RECEITA: "RECEITA",
  DESPESA: "DESPESA",
} as const;

export type TipoLancamento = typeof TipoLancamento[keyof typeof TipoLancamento];

export const StatusLancamento = {
  ABERTO: "ABERTO",
  PAGO: "PAGO",
  PARCIAL: "PARCIAL",
  ATRASADO: "ATRASADO",
  PREVISTO: "PREVISTO",
} as const;

export type StatusLancamento = typeof StatusLancamento[keyof typeof StatusLancamento];

export const FormaPagamento = {
  PIX: "PIX",
  TRANSFERENCIA: "TRANSFERENCIA",
  DINHEIRO: "DINHEIRO",
  BOLETO: "BOLETO",
} as const;

export type FormaPagamento = typeof FormaPagamento[keyof typeof FormaPagamento];

// Helper functions for validation
export const isValidTipoLancamento = (value: string): value is TipoLancamento => {
  return Object.values(TipoLancamento).includes(value as TipoLancamento);
};

export const isValidStatusLancamento = (value: string): value is StatusLancamento => {
  return Object.values(StatusLancamento).includes(value as StatusLancamento);
};

export const isValidFormaPagamento = (value: string): value is FormaPagamento => {
  return Object.values(FormaPagamento).includes(value as FormaPagamento);
};
