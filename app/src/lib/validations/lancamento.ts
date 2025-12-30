import {
  TipoLancamento,
  StatusLancamento,
  FormaPagamento,
  isValidTipoLancamento,
  isValidStatusLancamento,
  isValidFormaPagamento,
} from "@/types/financeiro";

export interface LancamentoCreateInput {
  tipo: string;
  categoriaId: string;
  descricao: string;
  valorPrevisto: number;
  valorPago?: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  formaPagamento?: string;
  anexo?: string;
}

export type LancamentoUpdateInput = Partial<LancamentoCreateInput>;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateLancamentoCreate(
  data: LancamentoCreateInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate tipo
  if (!data.tipo || !isValidTipoLancamento(data.tipo)) {
    errors.push({
      field: "tipo",
      message: "Tipo deve ser RECEITA ou DESPESA",
    });
  }

  // Validate categoriaId
  if (!data.categoriaId || typeof data.categoriaId !== "string") {
    errors.push({
      field: "categoriaId",
      message: "Categoria é obrigatória",
    });
  }

  // Validate descricao
  if (!data.descricao || typeof data.descricao !== "string" || data.descricao.trim().length === 0) {
    errors.push({
      field: "descricao",
      message: "Descrição é obrigatória",
    });
  }

  // Validate valorPrevisto
  if (typeof data.valorPrevisto !== "number" || data.valorPrevisto < 0) {
    errors.push({
      field: "valorPrevisto",
      message: "Valor previsto deve ser um número positivo",
    });
  }

  // Validate valorPago (optional)
  if (data.valorPago !== undefined && (typeof data.valorPago !== "number" || data.valorPago < 0)) {
    errors.push({
      field: "valorPago",
      message: "Valor pago deve ser um número positivo",
    });
  }

  // Validate dataVencimento
  if (!data.dataVencimento || isNaN(new Date(data.dataVencimento).getTime())) {
    errors.push({
      field: "dataVencimento",
      message: "Data de vencimento inválida",
    });
  }

  // Validate dataPagamento (optional)
  if (data.dataPagamento && isNaN(new Date(data.dataPagamento).getTime())) {
    errors.push({
      field: "dataPagamento",
      message: "Data de pagamento inválida",
    });
  }

  // Validate status
  if (!data.status || !isValidStatusLancamento(data.status)) {
    errors.push({
      field: "status",
      message: "Status deve ser ABERTO, PAGO, PARCIAL, ATRASADO ou PREVISTO",
    });
  }

  // Validate formaPagamento (optional)
  if (data.formaPagamento && !isValidFormaPagamento(data.formaPagamento)) {
    errors.push({
      field: "formaPagamento",
      message: "Forma de pagamento deve ser PIX, TRANSFERENCIA, DINHEIRO ou BOLETO",
    });
  }

  return errors;
}

export function validateLancamentoUpdate(
  data: LancamentoUpdateInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate provided fields
  if (data.tipo !== undefined && !isValidTipoLancamento(data.tipo)) {
    errors.push({
      field: "tipo",
      message: "Tipo deve ser RECEITA ou DESPESA",
    });
  }

  if (data.descricao !== undefined && (!data.descricao || data.descricao.trim().length === 0)) {
    errors.push({
      field: "descricao",
      message: "Descrição não pode estar vazia",
    });
  }

  if (data.valorPrevisto !== undefined && (typeof data.valorPrevisto !== "number" || data.valorPrevisto < 0)) {
    errors.push({
      field: "valorPrevisto",
      message: "Valor previsto deve ser um número positivo",
    });
  }

  if (data.valorPago !== undefined && (typeof data.valorPago !== "number" || data.valorPago < 0)) {
    errors.push({
      field: "valorPago",
      message: "Valor pago deve ser um número positivo",
    });
  }

  if (data.dataVencimento !== undefined && isNaN(new Date(data.dataVencimento).getTime())) {
    errors.push({
      field: "dataVencimento",
      message: "Data de vencimento inválida",
    });
  }

  if (data.dataPagamento !== undefined && data.dataPagamento && isNaN(new Date(data.dataPagamento).getTime())) {
    errors.push({
      field: "dataPagamento",
      message: "Data de pagamento inválida",
    });
  }

  if (data.status !== undefined && !isValidStatusLancamento(data.status)) {
    errors.push({
      field: "status",
      message: "Status deve ser ABERTO, PAGO, PARCIAL, ATRASADO ou PREVISTO",
    });
  }

  if (data.formaPagamento !== undefined && data.formaPagamento && !isValidFormaPagamento(data.formaPagamento)) {
    errors.push({
      field: "formaPagamento",
      message: "Forma de pagamento deve ser PIX, TRANSFERENCIA, DINHEIRO ou BOLETO",
    });
  }

  return errors;
}

