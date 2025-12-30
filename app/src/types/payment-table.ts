export interface MemberInfo {
  id: string;
  nomeCompleto: string;
  situacao: string;
}

export interface PaymentPeriodInfo {
  id: string;
  type: string;
  year: number;
  month: number | null;
  label: string | null;
}

export interface PaymentStatusInfo {
  memberId: string;
  periodId: string;
  status: string;
  amount: number | null;
  method: string | null;
  paidAt: Date | null;
  notes: string | null;
}

export interface PaymentTableData {
  members: MemberInfo[];
  periods: PaymentPeriodInfo[];
  statuses: { [key: string]: PaymentStatusInfo };
}
