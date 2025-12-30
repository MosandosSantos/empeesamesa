'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface KPISummary {
  previsto: number;
  recebido: number;
  emAberto: number;
  adimplencia: number;
}

interface KPICardsProps {
  summary: KPISummary;
}

export function KPICards({ summary }: KPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1);
  };

  const getAdimplenciaColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdimplenciaLabel = (percent: number) => {
    if (percent >= 80) return 'Excelente';
    if (percent >= 50) return 'Atenção necessária';
    return 'Crítico';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Receita Prevista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.previsto)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total esperado no período</p>
        </CardContent>
      </Card>

      {/* Card 2: Receita Recebida */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Receita Recebida</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.recebido)}</div>
          <p className="text-xs text-muted-foreground mt-1">Pagamentos confirmados</p>
        </CardContent>
      </Card>

      {/* Card 3: Em Aberto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.emAberto)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.emAberto > 0 ? 'Pendente de recebimento' : 'Nenhuma pendência'}
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Adimplência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Adimplência</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getAdimplenciaColor(summary.adimplencia)}`}>
            {formatPercent(summary.adimplencia)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getAdimplenciaLabel(summary.adimplencia)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
