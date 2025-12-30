"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MinimumStockCard } from "@/components/inventario/minimum-stock-card";
import { ExportMovementsDialog } from "@/components/inventario/export-movements-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, History, PlusCircle, Trash2 } from "lucide-react";
import { InventoryItemDTO, InventoryMovementDTO, InventoryMovementType } from "@/types/inventario";

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

type ErrorMap = Record<string, string>;

type MoveForm = {
  type: InventoryMovementType;
  qty: string;
  unitCost: string;
  reason: string;
};

type ArchiveForm = {
  password: string;
  reason: string;
};

export default function InventarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id as string;
  const [item, setItem] = useState<InventoryItemDTO | null>(null);
  const [movements, setMovements] = useState<InventoryMovementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [moveErrors, setMoveErrors] = useState<ErrorMap>({});
  const [archiveErrors, setArchiveErrors] = useState<ErrorMap>({});

  const [moveForm, setMoveForm] = useState<MoveForm>({
    type: InventoryMovementType.OUT,
    qty: "",
    unitCost: "",
    reason: "",
  });

  const [archiveForm, setArchiveForm] = useState<ArchiveForm>({
    password: "",
    reason: "",
  });

  useEffect(() => {
    if (!itemId) return;
    fetchItem();
    fetchUser();
  }, [itemId]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Erro ao buscar usuario:", err);
    }
  };

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/items/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error("Erro ao buscar item:", err);
    } finally {
      setLoading(false);
    }
  };

  const isBelowMin = (current: InventoryItemDTO | null) =>
    current ? current.minQty > 0 && current.qtyOnHand <= current.minQty : false;

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setMoveErrors({});
    if (!itemId) return;

    try {
      const payload = {
        itemId,
        qty: Number(moveForm.qty),
        unitCost: moveForm.type === InventoryMovementType.IN ? Number(moveForm.unitCost) : undefined,
        reason: moveForm.reason || undefined,
      };

      const endpoint =
        moveForm.type === InventoryMovementType.IN
          ? "/api/inventory/movements/in"
          : moveForm.type === InventoryMovementType.ADJUST
            ? "/api/inventory/movements/adjust"
            : "/api/inventory/movements/out";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchItem();
        setMoveOpen(false);
        setMoveForm({ type: InventoryMovementType.OUT, qty: "", unitCost: "", reason: "" });
      } else {
        const data = await res.json();
        if (data.errors) {
          const map: ErrorMap = {};
          data.errors.forEach((err: any) => (map[err.field] = err.message));
          setMoveErrors(map);
        } else {
          alert(data.error || "Erro ao movimentar estoque");
        }
      }
    } catch (err) {
      console.error("Erro ao movimentar estoque:", err);
      alert("Erro ao movimentar estoque");
    }
  };

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    setArchiveErrors({});

    if (!itemId) return;

    try {
      const payload = {
        password: archiveForm.password,
        reason: archiveForm.reason,
      };

      const res = await fetch(`/api/inventory/items/${itemId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchItem();
        setArchiveOpen(false);
        setArchiveForm({ password: "", reason: "" });
      } else {
        const data = await res.json();
        if (data.errors) {
          const map: ErrorMap = {};
          data.errors.forEach((err: any) => (map[err.field] = err.message));
          setArchiveErrors(map);
        } else {
          alert(data.error || "Erro ao arquivar item");
        }
      }
    } catch (err) {
      console.error("Erro ao arquivar item:", err);
      alert("Erro ao arquivar item");
    }
  };


  if (loading || !item) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-muted-foreground">Carregando item...</div>
      </div>
    );
  }

  const totalValue = item.qtyOnHand * item.avgCost;
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventario">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {item.name}
            {item.archivedAt && <Badge variant="outline">Arquivado</Badge>}
            {isBelowMin(item) && <Badge variant="destructive">Abaixo do minimo</Badge>}
          </h1>
          <p className="text-muted-foreground">
            SKU: {item.sku || "-"} | Categoria: {item.category || "Sem categoria"} | Local: {item.location || "Sem local"}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMovementsDialog
            itemId={itemId}
            triggerLabel="Exportar movimentos"
            triggerVariant="outline"
            triggerClassName="flex items-center"
          />
          <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" disabled={!!item.archivedAt}>
                <PlusCircle className="mr-2 h-4 w-4" /> Movimentar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Movimentar estoque</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMove} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    className="w-full border rounded-md bg-background px-3 py-2"
                    value={moveForm.type}
                    onChange={(e) =>
                      setMoveForm({
                        ...moveForm,
                        type: e.target.value as InventoryMovementType,
                      })
                    }
                  >
                    {isAdmin && <option value={InventoryMovementType.IN}>Entrada</option>}
                    <option value={InventoryMovementType.OUT}>Saida</option>
                    {isAdmin && <option value={InventoryMovementType.ADJUST}>Ajuste</option>}
                  </select>
                  {moveErrors.type && <p className="text-sm text-red-500">{moveErrors.type}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantidade</Label>
                    <Input
                      id="qty"
                      type="number"
                      min={moveForm.type === InventoryMovementType.ADJUST ? undefined : "0"}
                      value={moveForm.qty}
                      onChange={(e) => setMoveForm({ ...moveForm, qty: e.target.value })}
                      className={moveErrors.qty ? "border-red-500" : ""}
                    />
                    {moveErrors.qty && <p className="text-sm text-red-500">{moveErrors.qty}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Custo unitario</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={moveForm.unitCost}
                      onChange={(e) => setMoveForm({ ...moveForm, unitCost: e.target.value })}
                      disabled={moveForm.type !== InventoryMovementType.IN}
                      className={moveErrors.unitCost ? "border-red-500" : ""}
                    />
                    {moveErrors.unitCost && (
                      <p className="text-sm text-red-500">{moveErrors.unitCost}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reason">
                      Motivo {moveForm.type === InventoryMovementType.ADJUST ? "(obrigatorio)" : "(opcional)"}
                    </Label>
                    <Textarea
                      id="reason"
                      rows={3}
                      value={moveForm.reason}
                      onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
                      placeholder={
                        moveForm.type === InventoryMovementType.ADJUST
                          ? "Explique o motivo do ajuste"
                          : "Fornecedor, ajuste, evento..."
                      }
                    />
                    {moveErrors.reason && <p className="text-sm text-red-500">{moveErrors.reason}</p>}
                  </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {isAdmin && (
            <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Arquivar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Arquivar item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleArchive} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="archiveReason">Motivo *</Label>
                    <Textarea
                      id="archiveReason"
                      rows={4}
                      value={archiveForm.reason}
                      onChange={(e) => setArchiveForm({ ...archiveForm, reason: e.target.value })}
                      placeholder="Descreva o motivo do arquivamento"
                      className={archiveErrors.reason ? "border-red-500" : ""}
                    />
                    {archiveErrors.reason && (
                      <p className="text-sm text-red-500">{archiveErrors.reason}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha do admin *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={archiveForm.password}
                      onChange={(e) => setArchiveForm({ ...archiveForm, password: e.target.value })}
                      className={archiveErrors.password ? "border-red-500" : ""}
                    />
                    {archiveErrors.password && (
                      <p className="text-sm text-red-500">{archiveErrors.password}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setArchiveOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="destructive">
                      Confirmar arquivamento
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estoque atual</CardTitle>
            <CardDescription>Quantidade disponivel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {item.qtyOnHand} {item.unit || "un"}
            </div>
            <p className="text-sm text-muted-foreground">Atualizado em {new Date(item.updatedAt).toLocaleString()}</p>
          </CardContent>
        </Card>
        <MinimumStockCard
          title="Estoque minimo"
          description="Alerta configurado"
          value={item.minQty}
          showAlert={isBelowMin(item)}
        />
        <Card>
          <CardHeader>
            <CardTitle>Ponto de reposicao</CardTitle>
            <CardDescription>Reposicao sugerida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{item.reorderPoint}</div>
            <p className="text-sm text-muted-foreground">Ajuste conforme consumo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valor de estoque</CardTitle>
            <CardDescription>Custo medio e valor total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-sm text-muted-foreground">Custo medio: {formatCurrency(item.avgCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Historico do item
          </CardTitle>
          <CardDescription>Entradas, saidas e arquivamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-muted-foreground">Nenhuma movimentacao registrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-[#3b4d3b] text-white">
                  <tr>
                    <Th>Data</Th>
                    <Th>Tipo</Th>
                    <Th>Qtd</Th>
                    <Th>Custo unit</Th>
                    <Th>Valor</Th>
                    <Th>Antes/Depois</Th>
                    <Th>Custo antes/depois</Th>
                    <Th>Usuario</Th>
                    <Th>Motivo</Th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement, index) => (
                    <tr key={movement.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                      <Td>{new Date(movement.createdAt).toLocaleString()}</Td>
                      <Td>
                        <Badge variant="outline">{movement.type}</Badge>
                      </Td>
                      <Td className={movement.type === InventoryMovementType.OUT ? "text-red-600" : "text-green-600"}>
                        {movement.qty}
                      </Td>
                      <Td>
                        {movement.unitCost !== null && movement.unitCost !== undefined
                          ? formatCurrency(movement.unitCost)
                          : "-"}
                      </Td>
                      <Td>
                        {movement.movementValue !== null && movement.movementValue !== undefined
                          ? formatCurrency(movement.movementValue)
                          : "-"}
                      </Td>
                      <Td>{movement.qtyBefore} {'->'} {movement.qtyAfter}</Td>
                      <Td>{formatCurrency(movement.avgCostBefore)} {'->'} {formatCurrency(movement.avgCostAfter)}</Td>
                      <Td>{movement.createdByName || movement.createdById || "-"}</Td>
                      <Td className="max-w-xs truncate" title={movement.reason || undefined}>
                        {movement.reason || "-"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle text-xs text-foreground ${className}`}>{children}</td>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
