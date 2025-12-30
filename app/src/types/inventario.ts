// Inventory domain types (Sprint 9 v2)

export const InventoryMovementType = {
  IN: "IN",
  OUT: "OUT",
  ADJUST: "ADJUST",
  ARCHIVE: "ARCHIVE",
} as const;

export type InventoryMovementType =
  typeof InventoryMovementType[keyof typeof InventoryMovementType];

export interface InventoryItemDTO {
  id: string;
  tenantId: string;
  sku?: string | null;
  name: string;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  minQty: number;
  reorderPoint: number;
  qtyOnHand: number;
  avgCost: number;
  lastPurchaseCost?: number | null;
  assignedToMemberId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  archivedAt?: string | null;
  archivedById?: string | null;
  archivedByName?: string | null;
  archiveReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovementDTO {
  id: string;
  tenantId: string;
  itemId: string;
  type: InventoryMovementType;
  qty: number;
  unitCost?: number | null;
  movementValue?: number | null;
  qtyBefore: number;
  qtyAfter: number;
  avgCostBefore: number;
  avgCostAfter: number;
  reason?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const isValidInventoryMovementType = (
  value: string
): value is InventoryMovementType =>
  Object.values(InventoryMovementType).includes(value as InventoryMovementType);
