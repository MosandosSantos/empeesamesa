/**
 * Category Helper for Member Payment System
 * Provides find-or-create functionality for Categoria entities
 * Supports both standalone and Prisma transaction contexts
 */

import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

// Type for Prisma transaction client
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Finds an existing category or creates a new one if it doesn't exist
 *
 * @param tenantId - The tenant ID for multi-tenant isolation
 * @param categoryName - The name of the category to find or create
 * @param tx - Optional Prisma transaction client. If provided, operations run within the transaction
 * @returns Promise resolving to the category ID
 *
 * @example
 * // Standalone usage
 * const categoriaId = await findOrCreateCategoria(tenantId, "Mensalidades");
 *
 * @example
 * // Within a transaction
 * await prisma.$transaction(async (tx) => {
 *   const categoriaId = await findOrCreateCategoria(tenantId, "Mensalidades", tx);
 *   // ... use categoriaId for other operations
 * });
 */
export async function findOrCreateCategoria(
  tenantId: string,
  categoryName: string,
  tx?: TransactionClient
): Promise<string> {
  // Use transaction client if provided, otherwise use standalone prisma client
  const client = tx ?? prisma;

  try {
    // Try to find existing category
    // Using the unique constraint on [tenantId, nome]
    const existingCategoria = await client.categoria.findUnique({
      where: {
        tenantId_nome: {
          tenantId,
          nome: categoryName,
        },
      },
      select: {
        id: true,
      },
    });

    // If category exists, return its ID
    if (existingCategoria) {
      return existingCategoria.id;
    }

    // Category doesn't exist, create it
    const newCategoria = await client.categoria.create({
      data: {
        tenantId,
        nome: categoryName,
      },
      select: {
        id: true,
      },
    });

    return newCategoria.id;
  } catch (error) {
    // If there's a unique constraint violation (rare race condition),
    // try to find the category again
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      const categoria = await client.categoria.findUnique({
        where: {
          tenantId_nome: {
            tenantId,
            nome: categoryName,
          },
        },
        select: {
          id: true,
        },
      });

      if (categoria) {
        return categoria.id;
      }
    }

    // Re-throw any other errors
    throw error;
  }
}

/**
 * Batch finds or creates multiple categories
 * Useful for seeding or initial setup
 *
 * @param tenantId - The tenant ID
 * @param categoryNames - Array of category names to find or create
 * @returns Promise resolving to a map of category names to IDs
 *
 * @example
 * const categories = await findOrCreateMultipleCategories(
 *   tenantId,
 *   ["Mensalidades", "Anuidade Priorado", "Eventos"]
 * );
 * // Returns: { "Mensalidades": "uuid-1", "Anuidade Priorado": "uuid-2", ... }
 */
export async function findOrCreateMultipleCategories(
  tenantId: string,
  categoryNames: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // Process each category sequentially to avoid race conditions
  for (const name of categoryNames) {
    const id = await findOrCreateCategoria(tenantId, name);
    result[name] = id;
  }

  return result;
}
