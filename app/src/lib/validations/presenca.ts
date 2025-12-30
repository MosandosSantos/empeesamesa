// Tipos válidos para Meeting e Attendance

export const TIPOS_SESSAO = [
  "ORDINARIA",
  "EXTRAORDINARIA",
  "INICIACAO",
  "INSTALACAO",
  "MAGNA",
  "LUTO",
] as const;

export const STATUS_PRESENCA = ["PRESENTE", "FALTA", "JUSTIFICADA"] as const;

export type TipoSessao = (typeof TIPOS_SESSAO)[number];
export type StatusPresenca = (typeof STATUS_PRESENCA)[number];

export function isValidTipoSessao(tipo: string): tipo is TipoSessao {
  return TIPOS_SESSAO.includes(tipo as TipoSessao);
}

export function isValidStatusPresenca(status: string): status is StatusPresenca {
  return STATUS_PRESENCA.includes(status as StatusPresenca);
}

export interface MeetingCreateInput {
  dataSessao: string;
  tipo: string;
  titulo?: string;
  descricao?: string;
  observacoes?: string;
  lojaId?: string;
}

export type MeetingUpdateInput = Partial<MeetingCreateInput>;

export interface AttendanceInput {
  memberId: string;
  status: string;
  observacoes?: string;
}

export interface AttendanceBulkInput {
  attendances: AttendanceInput[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateMeetingCreate(
  data: MeetingCreateInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate dataSessao
  if (!data.dataSessao || isNaN(new Date(data.dataSessao).getTime())) {
    errors.push({
      field: "dataSessao",
      message: "Data da sessão é obrigatória e deve ser válida",
    });
  }

  // Validate tipo
  if (!data.tipo || !isValidTipoSessao(data.tipo)) {
    errors.push({
      field: "tipo",
      message: `Tipo deve ser: ${TIPOS_SESSAO.join(", ")}`,
    });
  }

  // Titulo is optional but if provided must not be empty
  if (data.titulo !== undefined && data.titulo.trim().length === 0) {
    errors.push({
      field: "titulo",
      message: "Título não pode estar vazio se fornecido",
    });
  }

  return errors;
}

export function validateMeetingUpdate(
  data: MeetingUpdateInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate provided fields
  if (data.dataSessao !== undefined && isNaN(new Date(data.dataSessao).getTime())) {
    errors.push({
      field: "dataSessao",
      message: "Data da sessão inválida",
    });
  }

  if (data.tipo !== undefined && !isValidTipoSessao(data.tipo)) {
    errors.push({
      field: "tipo",
      message: `Tipo deve ser: ${TIPOS_SESSAO.join(", ")}`,
    });
  }

  if (data.titulo !== undefined && data.titulo.trim().length === 0) {
    errors.push({
      field: "titulo",
      message: "Título não pode estar vazio",
    });
  }

  return errors;
}

export function validateAttendance(data: AttendanceInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate memberId
  if (!data.memberId || typeof data.memberId !== "string") {
    errors.push({
      field: "memberId",
      message: "ID do membro é obrigatório",
    });
  }

  // Validate status
  if (!data.status || !isValidStatusPresenca(data.status)) {
    errors.push({
      field: "status",
      message: `Status deve ser: ${STATUS_PRESENCA.join(", ")}`,
    });
  }

  return errors;
}

export function validateAttendanceBulk(
  data: AttendanceBulkInput
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data.attendances)) {
    errors.push({
      field: "attendances",
      message: "Attendances deve ser um array",
    });
    return errors;
  }

  data.attendances.forEach((attendance, index) => {
    const attendanceErrors = validateAttendance(attendance);
    attendanceErrors.forEach((error) => {
      errors.push({
        field: `attendances[${index}].${error.field}`,
        message: error.message,
      });
    });
  });

  return errors;
}
