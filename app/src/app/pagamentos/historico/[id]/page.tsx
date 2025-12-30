"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, DollarSign, FileText, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  nomeCompleto: string;
  class: string | null;
  situacao: string;
}

interface PaymentRecord {
  id: string;
  valor: number;
  dataPagamento: string;
  metodoPagamento: string;
  observacoes: string | null;
  tipo: string;
  periodo: {
    year: number;
    month: number | null;
    label: string;
  };
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function HistoricoPagamentosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load member data
        const memberRes = await fetch(`/api/membros/${id}`);
        if (!memberRes.ok) {
          throw new Error("Membro não encontrado");
        }
        const memberData = await memberRes.json();
        setMember(memberData);

        // Load payment history
        const paymentsRes = await fetch(`/api/payments/history/${id}`);
        if (!paymentsRes.ok) {
          throw new Error("Erro ao carregar histórico de pagamentos");
        }
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      PIX: "PIX",
      TRANSFERENCIA: "Transferência",
      DINHEIRO: "Dinheiro",
      BOLETO: "Boleto",
      CARTAO_CREDITO: "Cartão de Crédito",
      CARTAO_DEBITO: "Cartão de Débito",
    };
    return methods[method] || method;
  };

  const formatPeriodLabel = (period: PaymentRecord["periodo"]) => {
    if (period.month) {
      return `${monthNames[period.month - 1]}/${period.year}`;
    }
    return period.label || period.year.toString();
  };

  const getTotalPaid = () => {
    return payments.reduce((acc, payment) => acc + payment.valor, 0);
  };

  const toTitleCase = (name: string) =>
    name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">{error || "Membro não encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/pagamentos"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium hover:bg-muted transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Pagamentos</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            <User className="inline h-4 w-4 mr-1" />
            {toTitleCase(member.nomeCompleto)}
            {member.class && ` • ${member.class}`}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(getTotalPaid())}</div>
            <p className="text-xs text-muted-foreground mt-1">Soma de todos os pagamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Situação do Membro</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {member.situacao === "ATIVO" ? (
                <span className="text-emerald-600">Ativo</span>
              ) : (
                <span className="text-gray-600">{member.situacao}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo</CardTitle>
          <CardDescription>
            Todos os pagamentos registrados para {toTitleCase(member.nomeCompleto)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Pagamento Registrado</h3>
              <p className="text-muted-foreground max-w-md">
                Este membro ainda não possui pagamentos registrados no sistema.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-[#3b4d3b] text-white">
                  <TableRow>
                    <TableHead className="text-white">Data</TableHead>
                    <TableHead className="text-white">Período</TableHead>
                    <TableHead className="text-white">Tipo</TableHead>
                    <TableHead className="text-white text-right">Valor</TableHead>
                    <TableHead className="text-white">Método</TableHead>
                    <TableHead className="text-white">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow key={payment.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(payment.dataPagamento)}
                        </div>
                      </TableCell>
                      <TableCell>{formatPeriodLabel(payment.periodo)}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                          {payment.tipo.includes("MENSALIDADE") && "Mensalidade"}
                          {payment.tipo.includes("ANUIDADE") && "Anuidade"}
                          {payment.tipo.includes("EVENTO") && "Evento"}
                          {!payment.tipo.includes("MENSALIDADE") && !payment.tipo.includes("ANUIDADE") && !payment.tipo.includes("EVENTO") && payment.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        {formatCurrency(payment.valor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {formatPaymentMethod(payment.metodoPagamento)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.observacoes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
