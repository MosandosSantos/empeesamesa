"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Calendar, Building2, Receipt, CreditCard, Banknote, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/financeiro/currency-display";
import { FormaPagamento } from "@/types/financeiro";
import { canAccessFinance } from "@/lib/roles";

interface Categoria {
  id: string;
  nome: string;
}

interface MemberPayment {
  id: string;
  paymentType: string;
  referenceMonth: number | null;
  referenceYear: number | null;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
  lancamento: {
    categoria: {
      nome: string;
    };
  };
}

interface Member {
  id: string;
  nomeCompleto: string;
  situacao: string;
  class: string | null;
}

export default function PagamentosMembro({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/membros";
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [authError, setAuthError] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    paymentType: "MENSALIDADE_LOJA",
    referenceMonth: currentMonth.toString(),
    referenceYear: currentYear.toString(),
    description: "",
    amount: "",
    paymentMethod: "",
    paymentDate: new Date().toISOString().split('T')[0],
    categoriaId: "",
  });

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          setAuthError("N\u00e3o autorizado.");
          setLoadingData(false);
          return;
        }
        const data = await response.json();
        const userRole = data?.user?.role ?? null;
        if (!canAccessFinance(userRole)) {
          setAuthError("Voc\u00ea n\u00e3o tem permiss\u00e3o para acessar pagamentos.");
          setLoadingData(false);
          return;
        }

        fetchMember();
        fetchPayments();
        fetchCategorias();
      } catch {
        setAuthError("N\u00e3o foi poss\u00edvel validar a permiss\u00e3o.");
        setLoadingData(false);
      }
    };

    loadRole();
  }, []);

  if (authError) {
    return <p className="text-sm text-red-600">{authError}</p>;
  }

  useEffect(() => {
    // Auto-generate description based on payment type
    if (formData.paymentType === "MENSALIDADE_LOJA" && formData.referenceMonth && formData.referenceYear) {
      const monthName = new Date(parseInt(formData.referenceYear), parseInt(formData.referenceMonth) - 1).toLocaleDateString('pt-BR', { month: 'long' });
      setFormData(prev => ({
        ...prev,
        description: `Mensalidade da Loja - ${monthName}/${formData.referenceYear}`,
      }));
    } else if (formData.paymentType === "ANUIDADE_PRIORADO" && formData.referenceYear) {
      setFormData(prev => ({
        ...prev,
        description: `Anuidade do Priorado - ${formData.referenceYear}`,
      }));
    }
  }, [formData.paymentType, formData.referenceMonth, formData.referenceYear]);

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/membros/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setMember(data);
      }
    } catch (error) {
      console.error("Erro ao buscar membro:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/membros/${resolvedParams.id}/pagamentos`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias");
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        paymentType: formData.paymentType,
        referenceMonth: formData.paymentType === "MENSALIDADE_LOJA" ? parseInt(formData.referenceMonth) : null,
        referenceYear: parseInt(formData.referenceYear),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        categoriaId: formData.categoriaId,
      };

      const response = await fetch(`/api/membros/${resolvedParams.id}/pagamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Mostrar mensagem de sucesso
        alert("✅ Pagamento registrado com sucesso!");

        // Redirecionar para a origem
        router.push(returnTo);
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao registrar pagamento");
      }
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      alert("Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getPaymentTypeName = (type: string) => {
    const types: Record<string, string> = {
      MENSALIDADE_LOJA: "Mensalidade da Loja",
      ANUIDADE_PRIORADO: "Anuidade do Priorado",
      EVENTO: "Evento",
    };
    return types[type] || type;
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleDateString('pt-BR', { month: 'long' });
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, JSX.Element> = {
      PIX: <CreditCard className="h-3.5 w-3.5" />,
      TRANSFERENCIA: <TrendingUp className="h-3.5 w-3.5" />,
      DINHEIRO: <Banknote className="h-3.5 w-3.5" />,
      BOLETO: <Receipt className="h-3.5 w-3.5" />,
    };
    return icons[method] || <DollarSign className="h-3.5 w-3.5" />;
  };

  const getPaymentMethodName = (method: string) => {
    const names: Record<string, string> = {
      PIX: "PIX",
      TRANSFERENCIA: "Transfer\u00eancia",
      DINHEIRO: "Dinheiro",
      BOLETO: "Boleto",
    };
    return names[method] || method;
  };

  const getPaymentTypeBadge = (type: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      MENSALIDADE_LOJA: { label: "Mensalidade", variant: "default" },
      ANUIDADE_PRIORADO: { label: "Anuidade", variant: "secondary" },
      EVENTO: { label: "Evento", variant: "outline" },
    };
    const { label, variant } = config[type] || { label: type, variant: "outline" };
    return <Badge variant={variant} className="text-xs font-medium">{label}</Badge>;
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold mb-2">Membro não encontrado</h2>
          <p className="text-muted-foreground mb-6">O membro solicitado não existe ou foi removido</p>
          <Link href={returnTo}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Membros
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header com gradiente e glassmorphism */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <Link href={returnTo}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Pagamentos de Mensalidades
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm md:text-base">
                  <span className="font-semibold text-foreground">{member.nomeCompleto}</span>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="font-medium">
                    {member.situacao}
                  </Badge>
                  {member.class && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{member.class}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Pagamentos</p>
                  <p className="text-lg font-bold">{payments.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pago</p>
                  <p className="text-lg font-bold">
                    <CurrencyDisplay value={payments.reduce((sum, p) => sum + p.amount, 0)} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Pagamento</p>
                  <p className="text-lg font-bold">
                    {payments.length > 0 ? formatDate(payments[0].paymentDate) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulário de Novo Pagamento */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="space-y-1 pb-6 border-b border-border/40 bg-gradient-to-br from-muted/30 to-muted/10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <Receipt className="h-5 w-5" />
                    </div>
                    Registrar Novo Pagamento
                  </CardTitle>
                  <CardDescription className="text-base">
                    Adicione uma nova mensalidade, anuidade ou pagamento de evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Seção: Tipo de Pagamento */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Informações do Pagamento</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentType" className="text-sm font-medium flex items-center gap-2">
                        Tipo de Pagamento <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.paymentType}
                        onValueChange={(value) => updateField("paymentType", value)}
                      >
                        <SelectTrigger
                          id="paymentType"
                          className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MENSALIDADE_LOJA">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              Mensalidade da Loja
                            </div>
                          </SelectItem>
                          <SelectItem value="ANUIDADE_PRIORADO">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Anuidade do Priorado
                            </div>
                          </SelectItem>
                          <SelectItem value="EVENTO">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-primary" />
                              Evento
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seção: Período de Referência */}
                  {formData.paymentType === "MENSALIDADE_LOJA" && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Período de Referência</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="referenceMonth" className="text-sm font-medium">
                            Mês <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.referenceMonth}
                            onValueChange={(value) => updateField("referenceMonth", value)}
                          >
                            <SelectTrigger
                              id="referenceMonth"
                              className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <SelectItem key={month} value={month.toString()}>
                                  {getMonthName(month)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referenceYear" className="text-sm font-medium">
                            Ano <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.referenceYear}
                            onValueChange={(value) => updateField("referenceYear", value)}
                          >
                            <SelectTrigger
                              id="referenceYear"
                              className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentType === "ANUIDADE_PRIORADO" && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Ano de Referência</h3>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referenceYear" className="text-sm font-medium">
                          Ano <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.referenceYear}
                          onValueChange={(value) => updateField("referenceYear", value)}
                        >
                          <SelectTrigger
                            id="referenceYear"
                            className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Descrição e Categoria */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Descrição <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Ex: Mensalidade referente ao mês de Janeiro/2025"
                        value={formData.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={2}
                        className="resize-none bg-background border-border hover:border-primary/50 focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoriaId" className="text-sm font-medium">
                        Categoria Financeira <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.categoriaId}
                        onValueChange={(value) => updateField("categoriaId", value)}
                      >
                        <SelectTrigger
                          id="categoriaId"
                          className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                        >
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Valor e Forma de Pagamento */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-semibold text-foreground">Valores e Método</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Valor (R$) <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </div>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={formData.amount}
                            onChange={(e) => updateField("amount", e.target.value)}
                            className="h-11 pl-11 bg-background border-border hover:border-accent/50 focus:border-accent transition-colors text-lg font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-sm font-medium">
                          Forma de Pagamento <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) => updateField("paymentMethod", value)}
                        >
                          <SelectTrigger
                            id="paymentMethod"
                            className="h-11 bg-background border-border hover:border-primary/50 transition-colors"
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={FormaPagamento.PIX}>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                PIX
                              </div>
                            </SelectItem>
                            <SelectItem value={FormaPagamento.TRANSFERENCIA}>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Transfer\u00eancia
                              </div>
                            </SelectItem>
                            <SelectItem value={FormaPagamento.DINHEIRO}>
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Dinheiro
                              </div>
                            </SelectItem>
                            <SelectItem value={FormaPagamento.BOLETO}>
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Boleto
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentDate" className="text-sm font-medium">
                        Data do Pagamento <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => updateField("paymentDate", e.target.value)}
                        className="h-11 bg-background border-border hover:border-primary/50 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando pagamento...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Registrar Pagamento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Histórico de Pagamentos */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="space-y-1 pb-6 border-b border-border/40 bg-gradient-to-br from-muted/30 to-muted/10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-lg bg-accent text-accent-foreground shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Histórico de Pagamentos
                </CardTitle>
                <CardDescription className="text-base">
                  {payments.length > 0 ? (
                    <>
                      <span className="font-semibold text-foreground">{payments.length}</span> pagamento(s) registrado(s)
                    </>
                  ) : (
                    "Nenhum pagamento registrado ainda"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {payments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum pagamento ainda</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Os pagamentos registrados aparecerão aqui. Use o formulário ao lado para adicionar o primeiro pagamento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="group relative p-4 rounded-lg border border-border/40 bg-gradient-to-br from-card to-muted/20 hover:from-card hover:to-muted/30 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getPaymentTypeBadge(payment.paymentType)}
                              <span className="text-xs text-muted-foreground">•</span>
                              <Badge variant="outline" className="text-xs">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                <span className="ml-1">{getPaymentMethodName(payment.paymentMethod)}</span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{formatDate(payment.paymentDate)}</span>
                              {(payment.referenceMonth || payment.referenceYear) && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">
                                    Ref: {payment.referenceMonth && payment.referenceYear
                                      ? `${getMonthName(payment.referenceMonth)}/${payment.referenceYear}`
                                      : payment.referenceYear || "-"}
                                  </span>
                                </>
                              )}
                            </div>

                            {payment.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {payment.description}
                              </p>
                            )}

                            <div className="text-xs text-muted-foreground">
                              Categoria: {payment.lancamento?.categoria?.nome || "N/A"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
                              <CurrencyDisplay value={payment.amount} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Registrado em {formatDate(payment.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Hover effect line */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


