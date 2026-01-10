"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { TipoLancamento, StatusLancamento, FormaPagamento } from "@/types/financeiro";
import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";

interface Categoria {
  id: string;
  nome: string;
}

export default function NovaContaPage() {
  const { error: accessError, loading: accessLoading } = useRoleGuard(
    canAccessFinance,
    "Voce nao tem permissao para acessar o financeiro."
  );

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasError, setCategoriasError] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    tipo: TipoLancamento.DESPESA,
    categoriaId: "",
    descricao: "",
    valorPrevisto: "",
    valorPago: "",
    dataVencimento: "",
    dataPagamento: "",
    status: StatusLancamento.ABERTO,
    formaPagamento: "",
    anexo: "",
  });

  useEffect(() => {
    if (accessLoading || accessError) {
      return;
    }
    fetchCategorias();
  }, [accessError, accessLoading, formData.tipo]);

  if (accessError) {
    return <p className="text-sm text-red-600">{accessError}</p>;
  }

  if (accessLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    setCategoriasError("");
    try {
      console.log("[Frontend] Buscando categorias...");
      const params = new URLSearchParams({ tipo: formData.tipo });
      const response = await fetch(`/api/categorias?${params.toString()}`);
      console.log("[Frontend] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Frontend] Dados recebidos:", data);
        console.log("[Frontend] Categorias:", data.categorias);
        console.log("[Frontend] Número de categorias:", data.categorias?.length);

        if (data.categorias && Array.isArray(data.categorias)) {
          setCategorias(data.categorias);
          setFormData((prev) => {
            const categoriaIds = data.categorias.map((cat: Categoria) => cat.id);
            if (prev.categoriaId && !categoriaIds.includes(prev.categoriaId)) {
              return { ...prev, categoriaId: "" };
            }
            return prev;
          });
          console.log("[Frontend] Estado atualizado com", data.categorias.length, "categorias");
        } else {
          console.error("[Frontend] Formato de dados inválido:", data);
          setCategoriasError("Formato de dados inválido");
          setCategorias([]);
        }
      } else {
        const errorData = await response.json();
        console.error("[Frontend] Erro na API - Status:", response.status, "Dados:", errorData);
        setCategoriasError(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`);
        setCategorias([]);
      }
    } catch (error) {
      console.error("[Frontend] Erro ao buscar categorias:", error);
      setCategoriasError("Erro de conexão com a API");
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        tipo: formData.tipo,
        categoriaId: formData.categoriaId,
        descricao: formData.descricao.trim(),
        valorPrevisto: parseFloat(formData.valorPrevisto) || 0,
        valorPago: formData.valorPago ? parseFloat(formData.valorPago) : 0,
        dataVencimento: formData.dataVencimento,
        dataPagamento: formData.dataPagamento || undefined,
        status: formData.status,
        formaPagamento: formData.formaPagamento || undefined,
        anexo: formData.anexo || undefined,
      };

      const response = await fetch("/api/contas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/financeiro/contas");
      } else {
        const data = await response.json();
        if (data.errors) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          alert(data.error || "Erro ao criar lançamento");
        }
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      alert("Erro ao criar lançamento");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => {
      if (field === "tipo") {
        return { ...prev, tipo: value as TipoLancamento, categoriaId: "" };
      }
      return { ...prev, [field]: value };
    });
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/financeiro/contas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Conta</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova receita ou despesa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Tipo e Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Tipo e categoria do lançamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => updateField("tipo", value)}
                  >
                    <SelectTrigger id="tipo" className={errors.tipo ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TipoLancamento.RECEITA}>Receita</SelectItem>
                      <SelectItem value={TipoLancamento.DESPESA}>Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoriaId">
                    Categoria <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.categoriaId}
                    onValueChange={(value) => updateField("categoriaId", value)}
                    disabled={loadingCategorias}
                  >
                    <SelectTrigger id="categoriaId" className={errors.categoriaId ? "border-red-500" : ""}>
                      <SelectValue placeholder={
                        loadingCategorias
                          ? "Carregando categorias..."
                          : categorias.length === 0
                          ? "Nenhuma categoria disponível"
                          : "Selecione uma categoria"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.length === 0 && !loadingCategorias ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhuma categoria encontrada
                        </div>
                      ) : (
                        categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.categoriaId && <p className="text-sm text-red-500">{errors.categoriaId}</p>}
                  {categoriasError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                      {categoriasError}
                    </div>
                  )}
                  {!loadingCategorias && categorias.length > 0 && (
                    <p className="text-xs text-green-600">
                      {categorias.length} categoria(s) disponível(eis)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o lançamento..."
                  value={formData.descricao}
                  onChange={(e) => updateField("descricao", e.target.value)}
                  className={errors.descricao ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.descricao && <p className="text-sm text-red-500">{errors.descricao}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
              <CardDescription>Valores previstos e pagos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorPrevisto">
                    Valor Previsto (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="valorPrevisto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.valorPrevisto}
                    onChange={(e) => updateField("valorPrevisto", e.target.value)}
                    className={errors.valorPrevisto ? "border-red-500" : ""}
                  />
                  {errors.valorPrevisto && <p className="text-sm text-red-500">{errors.valorPrevisto}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorPago">Valor Pago (R$)</Label>
                  <Input
                    id="valorPago"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.valorPago}
                    onChange={(e) => updateField("valorPago", e.target.value)}
                    className={errors.valorPago ? "border-red-500" : ""}
                  />
                  {errors.valorPago && <p className="text-sm text-red-500">{errors.valorPago}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
              <CardDescription>Vencimento e pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">
                    Data de Vencimento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => updateField("dataVencimento", e.target.value)}
                    className={errors.dataVencimento ? "border-red-500" : ""}
                  />
                  {errors.dataVencimento && <p className="text-sm text-red-500">{errors.dataVencimento}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataPagamento">Data de Pagamento</Label>
                  <Input
                    id="dataPagamento"
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => updateField("dataPagamento", e.target.value)}
                    className={errors.dataPagamento ? "border-red-500" : ""}
                  />
                  {errors.dataPagamento && <p className="text-sm text-red-500">{errors.dataPagamento}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Status e Forma de Pagamento</CardTitle>
              <CardDescription>Status atual e método de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger id="status" className={errors.status ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StatusLancamento.ABERTO}>Aberto</SelectItem>
                      <SelectItem value={StatusLancamento.PAGO}>Pago</SelectItem>
                      <SelectItem value={StatusLancamento.PARCIAL}>Parcial</SelectItem>
                      <SelectItem value={StatusLancamento.ATRASADO}>Atrasado</SelectItem>
                      <SelectItem value={StatusLancamento.PREVISTO}>Previsto</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                  <Select
                    value={formData.formaPagamento}
                    onValueChange={(value) => updateField("formaPagamento", value)}
                  >
                    <SelectTrigger id="formaPagamento">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FormaPagamento.PIX}>PIX</SelectItem>
                      <SelectItem value={FormaPagamento.TRANSFERENCIA}>Transferência</SelectItem>
                      <SelectItem value={FormaPagamento.DINHEIRO}>Dinheiro</SelectItem>
                      <SelectItem value={FormaPagamento.BOLETO}>Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anexo">Anexo (URL do comprovante)</Label>
                <Input
                  id="anexo"
                  type="text"
                  placeholder="https://exemplo.com/comprovante.pdf (mock)"
                  value={formData.anexo}
                  onChange={(e) => updateField("anexo", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Funcionalidade de upload será implementada em versão futura
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/financeiro/contas">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Conta"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}


