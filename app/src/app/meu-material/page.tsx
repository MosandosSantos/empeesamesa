"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItemDTO } from "@/types/inventario";

export default function MeuMaterialPage() {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/items?assigned=true");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Erro ao buscar itens do membro:", err);
    } finally {
      setLoading(false);
    }
  };

  const isBelowMin = (item: InventoryItemDTO) =>
    item.minQty > 0 && item.qtyOnHand <= item.minQty;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu material</h1>
        <p className="text-muted-foreground">Itens atribuidos ao seu perfil</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">Nenhum item atribuido.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {item.name}
                  {isBelowMin(item) && <Badge variant="destructive">Abaixo do minimo</Badge>}
                </CardTitle>
                <CardDescription>{item.category || "Sem categoria"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  Quantidade: <strong>{item.qtyOnHand}</strong> {item.unit || "un"}
                </p>
                <p className="text-sm">Local: {item.location || "Sem local"}</p>
                {item.archivedAt && (
                  <p className="text-xs text-muted-foreground">Item arquivado</p>
                )}
                <p className="text-sm text-muted-foreground">Atualizado em {new Date(item.updatedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

