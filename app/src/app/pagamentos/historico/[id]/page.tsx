"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  User,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* =======================
   Types
======================= */

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

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function HistoricoPagamentosPage() {
  /* =======================
     HOOKS — SEMPRE NO TOPO
  ======================= */

  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const { error: accessError, loading: accessLoading } = useRoleGuard(
    canAccessFinance,
    "Você não tem permissão para acessar o financeiro."
  );

  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     EFFECT
  ======================= */

  useEffect(() => {
    if (!id || accessError) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const memberRes = await fetch(`/api/membros/${id}`);
        if (!memberRes.ok) throw new Error("Membro não encontrado");

        const paymentsRes = await fetch(`/api/payments/history/${id}`);
        if (!paymentsRes.ok) throw new Error("Erro ao carregar pagamentos");

        const memberData = await memberRes.json();
        const paymentsData = await paymentsRes.json();

        setMember(memberData);
        setPayments(paymentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, accessError]);

  /* =======================
     HELPERS
  ======================= */

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR").format(new Date(dateString));

  const formatPeriodLabel = (period: PaymentRecord["periodo"]) =>
    period.month
      ? `${monthNames[period.month - 1]}/${period.year}`
      : period.label || period.year.toString();

  const getTotalPaid = () =>
    payments.reduce((acc, payment) => acc + payment.valor, 0);

  const toTitleCase = (name: string) =>
    name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");

  /* =======================
     RENDERS CONDICIONAIS
  ======================= */

  if (accessLoading || loading) {
    return (
      <div className="container mx-auto py-12 text-center text-muted-foreground">
        Carregando histórico...
      </div>
    );
  }

  if (accessError || error || !member) {
    return (
      <div className="container mx-auto py-12 text-center text-red-600">
        {accessError || error || "Membro não encontrado"}
      </div>
    );
  }

  /* =======================
     RENDER PRINCIPAL
  ======================= */

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/pagamentos"
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
          <p className="text-muted-foreground mt-1">
            <User className="inline h-4 w-4 mr-1" />
            {toTitleCase(member.nomeCompleto)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Total de Pagamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Valor Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(getTotalPaid())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Situação</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.situacao}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {/* (sua tabela permanece igual, só removi aqui por espaço) */}
    </div>
  );
}
