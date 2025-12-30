/**
 * Validation functions for Member Payment System
 * Follows the validation pattern from lancamento.ts
 */

import {
  PaymentType,
  PaymentMethod,
  isValidPaymentType,
  isValidPaymentMethod,
  type MemberPaymentCreateInput,
  MonthNames,
} from "@/types/pagamento-membro";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates member payment creation data
 * @param data - Payment data to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateMemberPaymentCreate(
  data: Partial<MemberPaymentCreateInput>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate memberId
  if (!data.memberId || typeof data.memberId !== "string" || data.memberId.trim() === "") {
    errors.push({
      field: "memberId",
      message: "ID do membro é obrigatório",
    });
  }

  // Validate paymentType
  if (!data.paymentType) {
    errors.push({
      field: "paymentType",
      message: "Tipo de pagamento é obrigatório",
    });
  } else if (!isValidPaymentType(data.paymentType)) {
    errors.push({
      field: "paymentType",
      message: "Tipo de pagamento inválido",
    });
  } else {
    // Type-specific validations
    if (data.paymentType === PaymentType.MENSALIDADE_LOJA) {
      // Mensalidade requires both month and year
      if (data.referenceMonth === undefined || data.referenceMonth === null) {
        errors.push({
          field: "referenceMonth",
          message: "Mês de referência é obrigatório para mensalidades",
        });
      } else if (
        typeof data.referenceMonth !== "number" ||
        data.referenceMonth < 1 ||
        data.referenceMonth > 12
      ) {
        errors.push({
          field: "referenceMonth",
          message: "Mês de referência deve estar entre 1 e 12",
        });
      }

      if (data.referenceYear === undefined || data.referenceYear === null) {
        errors.push({
          field: "referenceYear",
          message: "Ano de referência é obrigatório para mensalidades",
        });
      } else if (
        typeof data.referenceYear !== "number" ||
        data.referenceYear < 2000 ||
        data.referenceYear > 2100
      ) {
        errors.push({
          field: "referenceYear",
          message: "Ano de referência inválido",
        });
      }
    } else if (data.paymentType === PaymentType.ANUIDADE_PRIORADO) {
      // Anuidade requires year only
      if (data.referenceYear === undefined || data.referenceYear === null) {
        errors.push({
          field: "referenceYear",
          message: "Ano de referência é obrigatório para anuidades",
        });
      } else if (
        typeof data.referenceYear !== "number" ||
        data.referenceYear < 2000 ||
        data.referenceYear > 2100
      ) {
        errors.push({
          field: "referenceYear",
          message: "Ano de referência inválido",
        });
      }
    }
    // EVENTO doesn't require referenceMonth or referenceYear
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push({
      field: "amount",
      message: "Valor é obrigatório",
    });
  } else if (typeof data.amount !== "number" || isNaN(data.amount)) {
    errors.push({
      field: "amount",
      message: "Valor deve ser um número válido",
    });
  } else if (data.amount <= 0) {
    errors.push({
      field: "amount",
      message: "Valor deve ser maior que zero",
    });
  }

  // Validate paymentMethod
  if (!data.paymentMethod) {
    errors.push({
      field: "paymentMethod",
      message: "Forma de pagamento é obrigatória",
    });
  } else if (!isValidPaymentMethod(data.paymentMethod)) {
    errors.push({
      field: "paymentMethod",
      message: "Forma de pagamento inválida",
    });
  }

  // Validate paymentDate
  if (!data.paymentDate || typeof data.paymentDate !== "string") {
    errors.push({
      field: "paymentDate",
      message: "Data de pagamento é obrigatória",
    });
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.paymentDate)) {
      errors.push({
        field: "paymentDate",
        message: "Data de pagamento deve estar no formato YYYY-MM-DD",
      });
    } else {
      const date = new Date(data.paymentDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: "paymentDate",
          message: "Data de pagamento inválida",
        });
      }
    }
  }

  // Validate description (optional, but if provided must be non-empty string)
  if (
    data.description !== undefined &&
    (typeof data.description !== "string" || data.description.trim() === "")
  ) {
    errors.push({
      field: "description",
      message: "Descrição deve ser uma string não vazia",
    });
  }

  return errors;
}

/**
 * Generates a default payment description based on payment type and member name
 * @param data - Payment data
 * @param memberName - Name of the member
 * @returns Generated description string
 */
export function generatePaymentDescription(
  data: MemberPaymentCreateInput,
  memberName: string
): string {
  const { paymentType, referenceMonth, referenceYear } = data;

  switch (paymentType) {
    case PaymentType.MENSALIDADE_LOJA:
      if (referenceMonth && referenceYear) {
        const monthName = MonthNames[referenceMonth] || referenceMonth.toString();
        return `Mensalidade - ${memberName} - ${monthName}/${referenceYear}`;
      }
      return `Mensalidade - ${memberName}`;

    case PaymentType.ANUIDADE_PRIORADO:
      if (referenceYear) {
        return `Anuidade Priorado - ${memberName} - ${referenceYear}`;
      }
      return `Anuidade Priorado - ${memberName}`;

    case PaymentType.EVENTO:
      return `Evento - ${memberName}`;

    default:
      return `Pagamento - ${memberName}`;
  }
}

/**
 * Validates if a payment already exists for a member in a specific period
 * Used to prevent duplicate payments
 * @param existingPayments - Array of existing payment records
 * @param newPayment - New payment data to check
 * @returns true if duplicate exists, false otherwise
 */
export function isDuplicatePayment(
  existingPayments: Array<{
    paymentType: string;
    referenceMonth: number | null;
    referenceYear: number | null;
  }>,
  newPayment: {
    paymentType: string;
    referenceMonth?: number;
    referenceYear?: number;
  }
): boolean {
  return existingPayments.some((existing) => {
    // Must match payment type
    if (existing.paymentType !== newPayment.paymentType) {
      return false;
    }

    // For MENSALIDADE_LOJA, must match both month and year
    if (newPayment.paymentType === PaymentType.MENSALIDADE_LOJA) {
      return (
        existing.referenceMonth === (newPayment.referenceMonth ?? null) &&
        existing.referenceYear === (newPayment.referenceYear ?? null)
      );
    }

    // For ANUIDADE_PRIORADO, must match year only
    if (newPayment.paymentType === PaymentType.ANUIDADE_PRIORADO) {
      return existing.referenceYear === (newPayment.referenceYear ?? null);
    }

    // For EVENTO, we don't check duplicates (multiple events can be paid)
    return false;
  });
}
