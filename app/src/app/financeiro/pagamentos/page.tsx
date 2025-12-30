'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Construction, Loader2 } from 'lucide-react';
import { PaymentTableDesktop } from '@/components/pagamentos/payment-table-desktop';
import { PaymentCardsMobile } from '@/components/pagamentos/payment-cards-mobile';
import { PaymentMatrixChart } from '@/components/pagamentos/payment-matrix-chart';
import type { PaymentTableData } from '@/types/payment-table';

type TabType = 'MONTHLY' | 'ANNUAL' | 'EVENTOS';

export default function PagamentosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('MONTHLY');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [data, setData] = useState<PaymentTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'EVENTOS') {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/payments/table?type=${activeTab}`);
        if (!response.ok) throw new Error('Failed to fetch payment data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        alert('Erro ao carregar dados de pagamentos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Filter data based on search and status
  const filteredData = data
    ? {
        ...data,
        members: data.members.filter((member) => {
          // Search filter
          if (searchTerm && !member.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }

          // Status filter
          if (statusFilter !== 'ALL') {
            const memberStatuses = data.periods.map(
              (period) => data.statuses[`${member.id}-${period.id}`]
            );

            if (statusFilter === 'PAID') {
              // Show only if ALL payments are paid
              return memberStatuses.every((s) => s.status === 'PAID');
            } else if (statusFilter === 'PENDING') {
              // Show if ANY payment is pending
              return memberStatuses.some((s) => s.status === 'PENDING');
            }
          }

          return true;
        }),
      }
    : null;

  // Prepare matrix chart data
  const prepareMatrixData = () => {
    if (!data) return null;

    // Format period labels
    const formattedPeriods = data.periods.map((period) => {
      let label = '';
      if (activeTab === 'MONTHLY') {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        label = period.month ? monthNames[period.month - 1] : period.label || '';
      } else {
        label = period.year.toString();
      }
      return {
        id: period.id,
        label,
      };
    });

    // Format members
    const formattedMembers = data.members.map((member) => ({
      id: member.id,
      name: member.nomeCompleto,
    }));

    // Simplify statuses to just PAID/PENDING
    const simplifiedStatuses: Record<string, 'PAID' | 'PENDING'> = {};
    Object.entries(data.statuses).forEach(([key, value]) => {
      simplifiedStatuses[key] = value.status;
    });

    return {
      members: formattedMembers,
      periods: formattedPeriods,
      statuses: simplifiedStatuses,
    };
  };

  const matrixData = prepareMatrixData();

  const handlePaymentUpdate = () => {
    // Refresh data
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/payments/table?type=${activeTab}`);
        if (!response.ok) throw new Error('Failed to fetch payment data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagamentos</h2>
          <p className="text-muted-foreground">
            Gerencie mensalidades, anuidades e eventos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="MONTHLY">Mensalidade</TabsTrigger>
          <TabsTrigger value="ANNUAL">Anuidade</TabsTrigger>
          <TabsTrigger value="EVENTOS">Eventos</TabsTrigger>
        </TabsList>

        {/* MENSALIDADE TAB */}
        <TabsContent value="MONTHLY" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PAID">Somente pagos</SelectItem>
                <SelectItem value="PENDING">Somente pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData ? (
            <>
              {/* Matrix Chart */}
              {matrixData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visualização de Pagamentos - Mensalidades</CardTitle>
                    <CardDescription>
                      Status de pagamento por membro e mês
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentMatrixChart data={matrixData} />
                  </CardContent>
                </Card>
              )}

              {/* Table/Cards */}
              {isMobile ? (
                <PaymentCardsMobile data={filteredData} onPaymentUpdate={handlePaymentUpdate} />
              ) : (
                <PaymentTableDesktop data={filteredData} onPaymentUpdate={handlePaymentUpdate} />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <p className="text-muted-foreground">Nenhum dado disponível</p>
            </div>
          )}
        </TabsContent>

        {/* ANUIDADE TAB */}
        <TabsContent value="ANNUAL" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PAID">Somente pagos</SelectItem>
                <SelectItem value="PENDING">Somente pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData ? (
            <>
              {/* Matrix Chart */}
              {matrixData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visualização de Pagamentos - Anuidades</CardTitle>
                    <CardDescription>
                      Status de pagamento por membro e ano
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentMatrixChart data={matrixData} />
                  </CardContent>
                </Card>
              )}

              {/* Table/Cards */}
              {isMobile ? (
                <PaymentCardsMobile data={filteredData} onPaymentUpdate={handlePaymentUpdate} />
              ) : (
                <PaymentTableDesktop data={filteredData} onPaymentUpdate={handlePaymentUpdate} />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <p className="text-muted-foreground">Nenhum dado disponível</p>
            </div>
          )}
        </TabsContent>

        {/* EVENTOS TAB (Placeholder) */}
        <TabsContent value="EVENTOS">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Construction className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Em Desenvolvimento</CardTitle>
              <CardDescription>
                A funcionalidade de pagamentos de eventos estará disponível em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Você poderá gerenciar pagamentos de eventos especiais como cerimônias,
                encontros e outras atividades da loja.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
