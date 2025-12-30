import { InventoryMovementType, isValidInventoryMovementType } from "@/types/inventario";

export interface InventoryItemInput {
  sku?: string | null;
  name: string;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  minQty?: number | null;
  reorderPoint?: number | null;
  assignedToMemberId?: string | null;
  notes?: string | null;
}

export interface InventoryMovementInput {
  type: string;
  qty: number;
  unitCost?: number | null;
  reason?: string | null;
  happenedAt?: string;
}

export interface InventoryArchiveInput {
  password: string;
  reason: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateInventoryItem(data: InventoryItemInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: "name", message: "Nome do item e obrigatorio e deve ter pelo menos 2 caracteres" });
  }

  if (data.minQty === undefined || data.minQty === null || isNaN(Number(data.minQty))) {
    errors.push({ field: "minQty", message: "Estoque minimo e obrigatorio" });
  } else if (data.minQty < 0) {
    errors.push({ field: "minQty", message: "Estoque minimo deve ser zero ou positivo" });
  }

  if (data.reorderPoint === undefined || data.reorderPoint === null || isNaN(Number(data.reorderPoint))) {
    errors.push({ field: "reorderPoint", message: "Ponto de reposicao e obrigatorio" });
  } else if (data.reorderPoint < 0) {
    errors.push({ field: "reorderPoint", message: "Ponto de reposicao deve ser zero ou positivo" });
  }

  if (
    data.minQty !== undefined &&
    data.minQty !== null &&
    data.reorderPoint !== undefined &&
    data.reorderPoint !== null &&
    !isNaN(Number(data.minQty)) &&
    !isNaN(Number(data.reorderPoint)) &&
    data.reorderPoint < data.minQty
  ) {
    errors.push({
      field: "reorderPoint",
      message: "Ponto de reposicao deve ser maior ou igual ao estoque minimo",
    });
  }

  return errors;
}

export function validateInventoryMovement(data: InventoryMovementInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.type || !isValidInventoryMovementType(data.type)) {
    errors.push({ field: "type", message: "Tipo deve ser IN, OUT, ADJUST ou ARCHIVE" });
  }

  if (data.qty === undefined || data.qty === null || isNaN(Number(data.qty))) {
    errors.push({ field: "qty", message: "Quantidade invalida" });
  } else if (data.type === InventoryMovementType.ADJUST) {
    if (data.qty === 0) {
      errors.push({ field: "qty", message: "Quantidade deve ser diferente de zero" });
    }
  } else if (data.qty <= 0) {
    errors.push({ field: "qty", message: "Quantidade deve ser maior que zero" });
  }

  if (data.type === InventoryMovementType.ADJUST && (!data.reason || data.reason.trim().length < 3)) {
    errors.push({ field: "reason", message: "Ajuste exige um motivo" });
  }

  if (data.type === InventoryMovementType.IN) {
    if (data.unitCost === undefined || data.unitCost === null || isNaN(Number(data.unitCost)) || data.unitCost <= 0) {
      errors.push({ field: "unitCost", message: "Entrada exige custo unitario positivo" });
    }
  }

  if (data.happenedAt && isNaN(new Date(data.happenedAt).getTime())) {
    errors.push({ field: "happenedAt", message: "Data/hora da movimentacao e invalida" });
  }

  return errors;
}

export function validateInventoryArchive(data: InventoryArchiveInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.password || data.password.trim().length < 4) {
    errors.push({ field: "password", message: "Senha obrigatoria" });
  }

  if (!data.reason || data.reason.trim().length < 10) {
    errors.push({ field: "reason", message: "Motivo deve ter pelo menos 10 caracteres" });
  }

  return errors;
}
