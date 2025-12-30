"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExportMovementsDialogProps = {
  itemId?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  triggerClassName?: string;
};

const formatDateInput = (value: Date) => value.toISOString().split("T")[0];

export function ExportMovementsDialog({
  itemId,
  triggerLabel = "Exportar movimentos",
  triggerVariant = "outline",
  triggerClassName,
}: ExportMovementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("30");
  const [customStart, setCustomStart] = useState(formatDateInput(new Date()));
  const [customEnd, setCustomEnd] = useState(formatDateInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [movementType, setMovementType] = useState("ALL");
  const [items, setItems] = useState<Array<{ id: string; name: string; sku?: string | null }>>([]);
  const [selectedItemId, setSelectedItemId] = useState("ALL");
  const [itemsLoading, setItemsLoading] = useState(false);
  const format: "pdf" = "pdf";

  const buildRange = () => {
    if (preset === "custom") {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const days = Number(preset);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  useEffect(() => {
    if (!open || itemId) return;

    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        const res = await fetch("/api/inventory/items?includeArchived=true&limit=200");
        if (res.ok) {
          const data = await res.json();
          const list = (data.items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
          }));
          setItems(list);
        }
      } catch (err) {
        console.error("Erro ao buscar itens do inventario:", err);
      } finally {
        setItemsLoading(false);
      }
    };

    fetchItems();
  }, [open, itemId]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const { start, end } = buildRange();
      const params = new URLSearchParams({
        type: "movements",
        format,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      if (itemId) params.set("itemId", itemId);
      if (!itemId && selectedItemId !== "ALL") params.set("itemId", selectedItemId);
      if (movementType !== "ALL") params.set("movementType", movementType);

      const res = await fetch(`/api/inventory/export?${params.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventario_movements.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      console.error("Erro ao exportar movimentos:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName} disabled={loading}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar relatorio de movimentacoes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Ultimos 30 dias</SelectItem>
                <SelectItem value="60">Ultimos 60 dias</SelectItem>
                <SelectItem value="90">Ultimos 90 dias</SelectItem>
                <SelectItem value="custom">Definir datas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de movimento</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="IN">Entrada</SelectItem>
                  <SelectItem value="OUT">Saida</SelectItem>
                  <SelectItem value="ADJUST">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!itemId && (
              <div className="space-y-2">
                <Label>Item</Label>
                <Select
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                  disabled={itemsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os itens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}{item.sku ? ` (${item.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="export-start">Data inicial</Label>
                <Input
                  id="export-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export-end">Data final</Label>
                <Input
                  id="export-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Gerando..." : "Gerar relatorio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
