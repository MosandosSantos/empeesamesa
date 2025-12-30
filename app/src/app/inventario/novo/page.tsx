"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

const UNITS = ["un", "par", "caixa", "litro", "metro", "kg"];

type ErrorMap = Record<string, string>;

export default function NovoItemInventarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    unit: "un",
    minQty: "",
    reorderPoint: "",
    location: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        sku: formData.sku || undefined,
        name: formData.name,
        category: formData.category || undefined,
        unit: formData.unit || undefined,
        minQty: formData.minQty ? Number(formData.minQty) : undefined,
        reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      };

      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/inventario");
        return;
      }

      const data = await res.json();
      if (data.errors) {
        const map: ErrorMap = {};
        data.errors.forEach((err: { field: string; message: string }) => {
          map[err.field] = err.message;
        });
        setErrors(map);
      } else {
        alert(data.error || "Erro ao criar item");
      }
    } catch (err) {
      console.error("Erro ao criar item:", err);
      alert("Erro ao criar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventario">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo item de inventario</h1>
          <p className="text-muted-foreground mt-1">Cadastre o item com estoque minimo e ponto de reposicao</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identificacao</CardTitle>
            <CardDescription>Nome, SKU, categoria e unidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  placeholder="Avental, malhete, caderno..."
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="SKU interno (opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={formData.unit} onValueChange={(value) => updateField("unit", value)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="Paramentos, Equipamentos, Suprimentos..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minQty">Estoque minimo</Label>
                <Input
                  id="minQty"
                  type="number"
                  min="0"
                  value={formData.minQty}
                  onChange={(e) => updateField("minQty", e.target.value)}
                  className={errors.minQty ? "border-red-500" : ""}
                  placeholder="Quantidade minima antes de repor"
                  required
                />
                {errors.minQty && <p className="text-sm text-red-500">{errors.minQty}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Ponto de reposicao</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => updateField("reorderPoint", e.target.value)}
                  className={errors.reorderPoint ? "border-red-500" : ""}
                  placeholder="Quantidade para disparar reposicao"
                  required
                />
                {errors.reorderPoint && <p className="text-sm text-red-500">{errors.reorderPoint}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localizacao e observacoes</CardTitle>
            <CardDescription>Onde o item fica e notas internas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localizacao</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Armario, sala, deposito..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notas internas sobre conservacao, fornecedor, etc."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/inventario">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar item"}
          </Button>
        </div>
      </form>
    </div>
  );
}

