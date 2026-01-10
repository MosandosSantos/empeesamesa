"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Calendar, History } from "lucide-react";
import { KPICards } from "@/components/pagamentos/kpi-cards";
import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";

type MemberSummary = {
  id: string;
  nomeCompleto: string;
  situacao: string;
  class: string | null;
  condicaoMensalidade: CondicaoMensalidade;
  mensalidadeValor: number;
  mensalidadeRegular: number;
  lojaId: string;
};

type Period = {
  id: string;
  year: number;
  month?: number | null;
  label: string;
};

type PaymentStatus = {
  isPaid: boolean;
  amount?: number;
  paymentDate?: string;
};

type PaymentGridData = {
  members: MemberSummary[];
  periods: Period[];
  statuses: Record<string, PaymentStatus>;
};

type LojaOption = {
  id: string;
  lojaMX: string;
  numero: number | null;
};

type TabType = "mensalidade" | "anuidade" | "eventos";
type CondicaoMensalidade = "REGULAR" | "FILIADO" | "REMIDO";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PAGE_SIZE = 10;

export default function PagamentosPage() {
  const [activeTab, setActiveTab] = useState<TabType>("mensalidade");
  const [gridData, setGridData] = useState<PaymentGridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lojas, setLojas] = useState<LojaOption[]>([]);
  const [lojaId, setLojaId] = useState("all");
  const [pageMensalidade, setPageMensalidade] = useState(1);
  const [pageAnuidade, setPageAnuidade] = useState(1);
  const [valorAnuidade, setValorAnuidade] = useState(500.00);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoMensalidade>("REGULAR");
  const [selectedMensalidadeValor, setSelectedMensalidadeValor] = useState<number | undefined>(undefined);
  const [selectedMensalidadeRegular, setSelectedMensalidadeRegular] = useState<number | undefined>(undefined);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<number>(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState<number>(currentYear);
  const [paymentValue, setPaymentValue] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [savingPayment, setSavingPayment] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const toTitleCase = (name: string) =>
    name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");

  const truncateName = (name: string, maxLength = 15) => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
  };

  const formatPeriodLabel = (period: Period) => {
    if (period.month) return monthNames[period.month - 1] ?? period.label;
    return period.label || period.year.toString();
  };

  const condicaoLabels: Record<CondicaoMensalidade, string> = {
    REGULAR: "Regular",
    FILIADO: "Filiado",
    REMIDO: "Remido",
  };
  const getCondicaoLabel = (condicao: string | undefined) =>
    condicaoLabels[(condicao as CondicaoMensalidade) ?? "REGULAR"];

  useEffect(() => {
    let mounted = true;

    const loadLojas = async () => {
      try {
        const response = await fetch("/api/lojas");
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) {
          setLojas(data.lojas || []);

          // Buscar valores da primeira loja como padrÃ£o
          if (data.lojas && data.lojas.length > 0) {
            const firstLojaId = data.lojas[0].id;
            const lojaResponse = await fetch(`/api/lojas/${firstLojaId}/valores`);
            if (lojaResponse.ok) {
              const lojaData = await lojaResponse.json();
              setValorAnuidade(parseFloat(lojaData.valorAnuidade) || 500.0);
            }
          }
        }
      } catch {
        if (mounted) {
          setLojas([]);
        }
      }
    };

    loadLojas();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadGrid = async (type: "MONTHLY" | "ANNUAL") => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          type,
          year: year.toString(),
        });
        if (lojaId !== "all") {
          params.set("lojaId", lojaId);
        }

        const response = await fetch(`/api/payments/grid?${params.toString()}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao carregar pagamentos");
        }

        const data: PaymentGridData = await response.json();
        if (mounted) {
          setGridData(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erro ao carregar pagamentos");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (activeTab === "mensalidade") {
      setPageMensalidade(1);
      loadGrid("MONTHLY");
    }

    if (activeTab === "anuidade") {
      setPageAnuidade(1);
      loadGrid("ANNUAL");
    }

    if (activeTab === "eventos") {
      setGridData(null);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [activeTab, year, lojaId]);

  const paginatedMembers = (members: MemberSummary[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      totalPages,
      safePage,
      slice: members.slice(start, start + PAGE_SIZE),
    };
  };

  const stats = useMemo(() => {
    if (!gridData) {
      return {
        monthlyForecast: 0,
        annualForecast: 0,
        recebido: 0,
        emAberto: 0,
        adimplencia: 0,
      };
    }

    const mensalidadeTotal = gridData.members.reduce(
      (total, member) => total + member.mensalidadeValor,
      0
    );

    const monthlyForecast =
      activeTab === "anuidade"
        ? (gridData.members.length * valorAnuidade) / 12
        : mensalidadeTotal;

    const annualForecast =
      activeTab === "anuidade"
        ? gridData.members.length * valorAnuidade
        : mensalidadeTotal * 12;

    let receivedTotal = 0;
    gridData.members.forEach((member) => {
      gridData.periods.forEach((period) => {
        const status = gridData.statuses[`${member.id}-${period.id}`];
        if (status?.amount && status.amount > 0) {
          receivedTotal += status.amount;
        }
      });
    });

    const recebido = receivedTotal;
    const adimplencia = annualForecast > 0 ? (recebido / annualForecast) * 100 : 0;
    const periodsCount = Math.max(1, gridData.periods.length);
    const monthlyPaid = receivedTotal / periodsCount;
    const monthlyOpen = monthlyForecast - monthlyPaid;
    const annualOpen = annualForecast - receivedTotal;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentPeriod = gridData.periods.find(
      (period) => period.year === currentYear && period.month === currentMonth
    );
    const payableMembers = gridData.members.filter(
      (member) => member.condicaoMensalidade !== "REMIDO"
    );
    const payableCount = payableMembers.length;
    let pendingMembers = 0;
    if (currentPeriod) {
      payableMembers.forEach((member) => {
        const status = gridData.statuses[`${member.id}-${currentPeriod.id}`];
        if (!status?.isPaid) {
          pendingMembers += 1;
        }
      });
    }
    const paidMembers = payableCount - pendingMembers;
    const monthlyDelinquencyPercent =
      payableCount > 0 ? (pendingMembers / payableCount) * 100 : 0;

    return {
      monthlyForecast,
      annualForecast,
      recebido,
      emAberto: annualOpen,
      adimplencia,
      monthlyOpen,
      annualOpen,
      monthlyDelinquencyPercent,
    };
  }, [gridData, activeTab, valorAnuidade]);

  const { error: accessError, loading: accessLoading } = useRoleGuard(
    canAccessFinance,
    "Voce nao tem permissao para acessar o financeiro."
  );

  if (accessError) {
    return <p className="text-sm text-red-600">{accessError}</p>;
  }

  if (accessLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  const periods = gridData?.periods ?? [];
  const mensalidadePagination = paginatedMembers(gridData?.members ?? [], pageMensalidade);
  const anuidadePagination = paginatedMembers(gridData?.members ?? [], pageAnuidade);

  const lojaOptions = [
    { id: "all", label: "Todas as lojas" },
    ...lojas.map((loja) => ({
      id: loja.id,
      label: `${loja.lojaMX}${loja.numero ? ` #${loja.numero}` : ""}`,
    })),
  ];

  const handleOpenPaymentModal = (
    memberId: string,
    memberName: string,
    condicao: CondicaoMensalidade,
    mensalidadeValor?: number
  ) => {
    setSelectedMember({ id: memberId, name: memberName });
    setSelectedCondicao(condicao);
    setSelectedMensalidadeRegular(
      gridData?.members.find((member) => member.id === memberId)?.mensalidadeRegular ??
        mensalidadeValor
    );
    setSelectedMensalidadeValor(mensalidadeValor);
    setPaymentMonth(new Date().getMonth() + 1);
    setPaymentYear(currentYear);
    setPaymentValue(
      mensalidadeValor !== undefined ? mensalidadeValor.toFixed(2) : ""
    );
    setPaymentMethod("PIX");
    setShowPaymentModal(true);
    setPaymentWarning(null);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedMember(null);
    setPaymentValue("");
    setSelectedCondicao("REGULAR");
    setSelectedMensalidadeValor(undefined);
    setSelectedMensalidadeRegular(undefined);
    setPaymentWarning(null);
  };

  const handleSavePayment = async () => {
    if (!selectedMember || !paymentValue || parseFloat(paymentValue) <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const paidValue = parseFloat(paymentValue);
    if (
      selectedMensalidadeRegular !== undefined &&
      Math.abs(paidValue - selectedMensalidadeRegular) > 0.009
    ) {
      const warningMessage = `Valor informado (${formatCurrency(
        paidValue
      )}) difere da mensalidade regular (${formatCurrency(
        selectedMensalidadeRegular
      )}). Deseja continuar com o valor informado?`;
      setPaymentWarning(warningMessage);
      const wantsToContinue = window.confirm(warningMessage);
      if (!wantsToContinue) {
        return;
      }
      setPaymentWarning(null);
    }

    setSavingPayment(true);

    try {
      const response = await fetch("/api/payments/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          year: paymentYear,
          month: activeTab === "mensalidade" ? paymentMonth : null,
          valor: parseFloat(paymentValue),
          metodoPagamento: paymentMethod,
          tipo: activeTab === "mensalidade" ? "MONTHLY" : "ANNUAL",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(data.error || "Erro ao registrar pagamento");
      }

      // Resetar estado ANTES de mostrar o alert
      setSavingPayment(false);
      handleClosePaymentModal();

      // Mostrar mensagem de sucesso
      alert("âœ… Pagamento registrado com sucesso!");

      // Recarregar os dados
      const loadType = activeTab === "mensalidade" ? "MONTHLY" : "ANNUAL";
      const params = new URLSearchParams({
        type: loadType,
        year: year.toString(),
      });
      if (lojaId !== "all") {
        params.set("lojaId", lojaId);
      }

      const gridResponse = await fetch(`/api/payments/grid?${params.toString()}`);
      if (gridResponse.ok) {
        const data = await gridResponse.json();
        setGridData(data);
      }
    } catch (err) {
      console.error("Erro ao salvar pagamento:", err);
      setSavingPayment(false);
      alert("âŒ " + (err instanceof Error ? err.message : "Erro ao registrar pagamento"));
    }
  };

  const renderFilters = () => (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <select
          value={lojaId}
          onChange={(event) => setLojaId(event.target.value)}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none md:w-64"
        >
          {lojaOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2000}
          max={2100}
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none md:w-32"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Pagamentos</h1>
          <p className="text-muted-foreground mt-1">
            Controle de mensalidades, anuidades e eventos
          </p>
        </div>
      </div>

      <Tabs defaultValue="mensalidade" className="w-full" onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mensalidade">Mensalidade</TabsTrigger>
          <TabsTrigger value="anuidade">Anuidade</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="mensalidade" className="space-y-4">
          {renderFilters()}

          <KPICards summary={stats} />

          <Card>
            <CardHeader>
              <CardTitle>Mensalidades {year}</CardTitle>
              <CardDescription>Pagamentos mensais dos membros</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : gridData ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-[#3b4d3b] text-white">
                      <TableRow>
                        <TableHead className="text-white">Membro</TableHead>
                        <TableHead className="text-center text-white">Condição</TableHead>
                        {periods.map((period) => (
                          <TableHead key={period.id} className="text-center text-white">
                            {formatPeriodLabel(period)}
                          </TableHead>
                        ))}
                        <TableHead className="text-center text-white">Total</TableHead>
                        <TableHead className="text-center text-white">Pagar</TableHead>
                        <TableHead className="text-center text-white">Histórico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mensalidadePagination.slice.map((member, index) => {
                        const totalPago = periods.reduce((acc, period) => {
                          const status = gridData.statuses[`${member.id}-${period.id}`];
                          return acc + (status?.amount ?? 0);
                        }, 0);

                        return (
                            <TableRow key={member.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                              <TableCell className="font-medium">
                                {truncateName(toTitleCase(member.nomeCompleto))}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm font-semibold">
                                  {getCondicaoLabel(member.condicaoMensalidade)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(member.mensalidadeValor)}
                                </div>
                              </TableCell>
                            {periods.map((period) => {
                              const status = gridData.statuses[`${member.id}-${period.id}`];
                              const amount = status?.amount ?? 0;

                              return (
                                <TableCell key={`${member.id}-${period.id}`} className="text-center">
                                  {amount > 0 ? formatCurrency(amount) : "-"}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center">{formatCurrency(totalPago)}</TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPaymentModal(
                                    member.id,
                                    member.nomeCompleto,
                                    member.condicaoMensalidade as CondicaoMensalidade,
                                    member.mensalidadeValor
                                  )
                                }
                                className="inline-flex h-8 items-center justify-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700"
                                title="Registrar pagamento"
                              >
                                Pagar
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/pagamentos/historico/${member.id}`}>
                                <button
                                  type="button"
                                  className="inline-flex h-8 items-center gap-1 justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                                  title="Ver histÃ³rico de pagamentos"
                                >
                                  <History className="h-3 w-3" />
                                  Histórico
                                </button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter className="bg-[#2d3d2d]">
                      <TableRow>
                        <TableCell className="font-bold text-white">TOTAL DO ANO</TableCell>
                        <TableCell className="text-center text-white"></TableCell>
                        {periods.map((period) => {
                          const totalPeriodo = mensalidadePagination.slice.reduce((acc, member) => {
                            const status = gridData.statuses[`${member.id}-${period.id}`];
                            return acc + (status?.amount ?? 0);
                          }, 0);
                          return (
                            <TableCell key={`total-${period.id}`} className="text-center font-bold text-white">
                              {totalPeriodo > 0 ? formatCurrency(totalPeriodo) : "-"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold text-white">
                          {formatCurrency(
                            mensalidadePagination.slice.reduce((acc, member) => {
                              const total = periods.reduce((sum, period) => {
                                const status = gridData.statuses[`${member.id}-${period.id}`];
                                return sum + (status?.amount ?? 0);
                              }, 0);
                              return acc + total;
                            }, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-center"></TableCell>
                        <TableCell className="text-center"></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
              {gridData && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
                  <span>
                    Pagina {mensalidadePagination.safePage} de {mensalidadePagination.totalPages} | {gridData.members.length} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPageMensalidade((prev) => Math.max(1, prev - 1))}
                      disabled={mensalidadePagination.safePage === 1}
                      className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPageMensalidade((prev) => Math.min(mensalidadePagination.totalPages, prev + 1))}
                      disabled={mensalidadePagination.safePage === mensalidadePagination.totalPages}
                      className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anuidade" className="space-y-4">
          {renderFilters()}

          <KPICards summary={stats} />

          <Card>
            <CardHeader>
              <CardTitle>Anuidades</CardTitle>
              <CardDescription>Pagamentos anuais dos membros</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : gridData ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-[#3b4d3b] text-white">
                      <TableRow>
                        <TableHead className="text-white">Membro</TableHead>
                        <TableHead className="text-center text-white">Condição</TableHead>
                        {periods.map((period) => (
                          <TableHead key={period.id} className="text-center text-white">
                            {formatPeriodLabel(period)}
                          </TableHead>
                        ))}
                        <TableHead className="text-center text-white">Total</TableHead>
                        <TableHead className="text-center text-white">Pagar</TableHead>
                        <TableHead className="text-center text-white">Histórico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anuidadePagination.slice.map((member, index) => {
                        const totalPago = periods.reduce((acc, period) => {
                          const status = gridData.statuses[`${member.id}-${period.id}`];
                          return acc + (status?.amount ?? 0);
                        }, 0);

                        return (
                          <TableRow key={member.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                            <TableCell className="font-medium">
                              {truncateName(toTitleCase(member.nomeCompleto))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm font-semibold">
                                {getCondicaoLabel(member.condicaoMensalidade)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(member.mensalidadeValor)}
                              </div>
                            </TableCell>
                            {periods.map((period) => {
                              const status = gridData.statuses[`${member.id}-${period.id}`];
                              const amount = status?.amount ?? 0;

                              return (
                                <TableCell key={`${member.id}-${period.id}`} className="text-center">
                                  {amount > 0 ? formatCurrency(amount) : "-"}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center">{formatCurrency(totalPago)}</TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPaymentModal(
                                    member.id,
                                    member.nomeCompleto,
                                    member.condicaoMensalidade as CondicaoMensalidade,
                                    member.mensalidadeValor
                                  )
                                }
                                className="inline-flex h-8 items-center justify-center rounded-md bg-green-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700"
                                title="Registrar pagamento"
                              >
                                Pagar
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/pagamentos/historico/${member.id}`}>
                                <button
                                  type="button"
                                  className="inline-flex h-8 items-center gap-1 justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                                  title="Ver histÃ³rico de pagamentos"
                                >
                                  <History className="h-3 w-3" />
                                  HistÃ³rico
                                </button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter className="bg-[#2d3d2d]">
                      <TableRow>
                        <TableCell className="font-bold text-white">TOTAL DO PERÍODO</TableCell>
                        <TableCell className="text-center text-white"></TableCell>
                        {periods.map((period) => {
                          const totalPeriodo = anuidadePagination.slice.reduce((acc, member) => {
                            const status = gridData.statuses[`${member.id}-${period.id}`];
                            return acc + (status?.amount ?? 0);
                          }, 0);
                          return (
                            <TableCell key={`total-${period.id}`} className="text-center font-bold text-white">
                              {totalPeriodo > 0 ? formatCurrency(totalPeriodo) : "-"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold text-white">
                          {formatCurrency(
                            anuidadePagination.slice.reduce((acc, member) => {
                              const total = periods.reduce((sum, period) => {
                                const status = gridData.statuses[`${member.id}-${period.id}`];
                                return sum + (status?.amount ?? 0);
                              }, 0);
                              return acc + total;
                            }, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-center"></TableCell>
                        <TableCell className="text-center"></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
              )}
              {gridData && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
                  <span>
                    Pagina {anuidadePagination.safePage} de {anuidadePagination.totalPages} | {gridData.members.length} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPageAnuidade((prev) => Math.max(1, prev - 1))}
                      disabled={anuidadePagination.safePage === 1}
                      className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPageAnuidade((prev) => Math.min(anuidadePagination.totalPages, prev + 1))}
                      disabled={anuidadePagination.safePage === anuidadePagination.totalPages}
                      className="h-9 rounded-md border border-border px-3 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos de Eventos</CardTitle>
              <CardDescription>Taxas e pagamentos relacionados a eventos especiais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
                <p className="text-muted-foreground max-w-md">
                  O modulo de pagamentos de eventos esta em desenvolvimento e estara disponivel em breve.
                  Aqui voce podera gerenciar taxas de inscricao, jantares rituais e outros eventos especiais.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {showPaymentModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Registrar Pagamento</h2>
              <p className="text-sm text-gray-600 mt-1">
                {toTitleCase(selectedMember.name)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {selectedMember && (
                <div className="gap-1 rounded-md border border-border bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Condição da mensalidade
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {getCondicaoLabel(selectedCondicao)} â€“{" "}
                    {selectedMensalidadeValor !== undefined
                      ? formatCurrency(selectedMensalidadeValor)
                      : "Valor nÃ£o definido"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mensalidade regular esperada:{" "}
                    {selectedMensalidadeRegular
                      ? formatCurrency(selectedMensalidadeRegular)
                      : "â€“"}
                  </p>
                </div>
              )}
              {paymentWarning && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {paymentWarning}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paymentMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    MÃªs
                  </label>
                  <select
                    id="paymentMonth"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="paymentYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    id="paymentYear"
                    value={paymentYear}
                    onChange={(e) => setPaymentYear(Number(e.target.value))}
                    min={2020}
                    max={2100}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="paymentValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  id="paymentValue"
                  value={paymentValue}
                  onChange={(e) => {
                    setPaymentValue(e.target.value);
                    setPaymentWarning(null);
                  }}
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pagamento
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="PIX">PIX</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleClosePaymentModal}
                disabled={savingPayment}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {savingPayment ? "Salvando..." : "Salvar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

