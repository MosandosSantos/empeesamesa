/**
 * Period Generator - Sprint Pagamentos
 *
 * Gera períodos de pagamento dinamicamente sem armazenamento em banco.
 * - Mensalidade: 12 meses do ano atual
 * - Anuidade: 6 anos a partir do ano atual
 */

export interface MonthlyPeriod {
  id: string;        // "2025-01"
  year: number;      // 2025
  month: number;     // 1-12
  label: string;     // "Jan/2025"
  paymentType: "MENSALIDADE_LOJA";
}

export interface AnnualPeriod {
  id: string;        // "2025"
  year: number;      // 2025
  label: string;     // "2025"
  paymentType: "ANUIDADE_PRIORADO";
}

export type Period = MonthlyPeriod | AnnualPeriod;

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

/**
 * Gera 12 períodos mensais para um ano específico
 * @param year Ano para gerar os períodos (ex: 2025)
 * @returns Array com 12 períodos mensais
 */
export function generateMonthlyPeriods(year: number): MonthlyPeriod[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      id: `${year}-${month.toString().padStart(2, '0')}`,
      year,
      month,
      label: `${MONTH_NAMES[i]}/${year}`,
      paymentType: "MENSALIDADE_LOJA",
    };
  });
}

/**
 * Gera períodos anuais a partir de um ano inicial
 * @param startYear Ano inicial (ex: 2025)
 * @param count Quantidade de anos a gerar (padrão: 6)
 * @returns Array com períodos anuais
 */
export function generateAnnualPeriods(startYear: number, count: number = 6): AnnualPeriod[] {
  return Array.from({ length: count }, (_, i) => {
    const year = startYear + i;
    return {
      id: `${year}`,
      year,
      label: `${year}`,
      paymentType: "ANUIDADE_PRIORADO",
    };
  });
}
