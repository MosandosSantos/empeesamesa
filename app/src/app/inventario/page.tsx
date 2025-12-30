"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportMovementsDialog } from "@/components/inventario/export-movements-dialog";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  History,
  Package,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { InventoryItemDTO } from "@/types/inventario";

interface Summary {
  total: number;
  belowMin: number;
  archived: number;
  totalValue: number;
}

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    belowMin: 0,
    archived: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    assigned: "all",
    belowMin: false,
    includeArchived: false,
  });

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.assigned === "assigned") params.set("assigned", "true");
      if (filters.assigned === "unassigned") params.set("assigned", "false");
      if (filters.belowMin) params.set("belowMin", "true");
      if (filters.includeArchived) params.set("includeArchived", "true");

      const res = await fetch(`/api/inventory/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary || { total: 0, belowMin: 0, archived: 0, totalValue: 0 });
      }
    } catch (error) {
      console.error("Erro ao buscar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const isBelowMin = (item: InventoryItemDTO) =>
    item.minQty > 0 && item.qtyOnHand <= item.minQty;

  const exportCsv = async (type: "items" | "movements") => {
    try {
      const res = await fetch(`/api/inventory/export?type=${type}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = type === "items" ? "inventario_itens.csv" : "inventario_movements.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar CSV:", err);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1">
            Controle de materiais, entradas/saidas e alertas de estoque minimo
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          titulo="Total de itens"
          valor={summary.total}
          descricao="Itens ativos do tenant"
          icon={<Package className="h-4 w-4 text-blue-600" />}
        />
        <InfoCard
          titulo="Abaixo do minimo"
          valor={summary.belowMin}
          descricao="Itens criticos para reposicao"
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          destaque="text-red-600"
        />
        <InfoCard
          titulo="Valor total"
          valor={summary.totalValue}
          descricao="Valor estimado do inventario"
          icon={<RefreshCw className="h-4 w-4 text-muted-foreground" />}
          formatter={formatCurrency}
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por nome, sku, categoria ou local"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="h-10 md:w-80"
            />
            <Select
              value={filters.assigned}
              onValueChange={(value) => setFilters({ ...filters, assigned: value })}
            >
              <SelectTrigger className="h-10 md:w-56">
                <SelectValue placeholder="Atribuicao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="assigned">Atribuidos a membro</SelectItem>
                <SelectItem value="unassigned">Somente da loja</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={filters.belowMin ? "destructive" : "outline"}
              onClick={() => setFilters((prev) => ({ ...prev, belowMin: !prev.belowMin }))}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {filters.belowMin ? "Filtrando criticos" : "Filtrar criticos"}
            </Button>
            <Button
              variant={filters.includeArchived ? "default" : "outline"}
              onClick={() =>
                setFilters((prev) => ({ ...prev, includeArchived: !prev.includeArchived }))
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {filters.includeArchived ? "Incluindo arquivados" : "Ocultar arquivados"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportCsv("items")}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar Itens
            </Button>
            
            <Link href="/inventario/novo">
              <Button className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto rounded-md border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando inventario...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum item encontrado com os filtros selecionados
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#3b4d3b] text-white">
                <tr>
                  <Th>Item</Th>
                  <Th>Sku</Th>
                  <Th>Qtd</Th>
                  <Th>Estoque minimo</Th>
                  <Th>Ponto de reposicao</Th>
                  <Th>Custo medio</Th>
                  <Th>Valor total</Th>
                  <Th>Atribuido</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Acoes</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                    <Td className="font-medium">
                      <div className="text-foreground">{item.name}</div>
                      {item.category && (
                        <div className="text-[11px] text-muted-foreground">{item.category}</div>
                      )}
                    </Td>
                    <Td>{item.sku || "-"}</Td>
                    <Td>
                      <span className="font-semibold">
                        {item.qtyOnHand} {item.unit || ""}
                      </span>
                    </Td>
                    <Td>{item.minQty}</Td>
                    <Td>{item.reorderPoint}</Td>
                    <Td>{formatCurrency(item.avgCost)}</Td>
                    <Td>{formatCurrency(item.qtyOnHand * item.avgCost)}</Td>
                    <Td>
                      <Badge variant={item.assignedToMemberId ? "secondary" : "outline"}>
                        {item.assignedToMemberId ? "Membro" : "Loja"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2 items-center">
                        {isBelowMin(item) && (
                          <Badge variant="destructive">Abaixo do minimo</Badge>
                        )}
                        <Badge variant={item.archivedAt ? "outline" : "default"}>
                          {item.archivedAt ? "Arquivado" : "Ativo"}
                        </Badge>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <Link href={`/inventario/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver / Movimentar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  titulo,
  valor,
  descricao,
  icon,
  destaque,
  formatter,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: ReactNode;
  destaque?: string;
  formatter?: (value: number) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
        {icon}
      </div>
      <p className={`mt-1 text-2xl font-semibold text-foreground ${destaque ?? ""}`}>
        {formatter ? formatter(valor) : valor}
      </p>
      <p className="text-xs text-muted-foreground">{descricao}</p>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-3 py-2 align-middle text-xs text-foreground ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

