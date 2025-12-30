/**
 * Enums do sistema EsferaORDO
 *
 * Como SQLite não suporta enums nativos, usamos Strings no Prisma schema.
 * Estes enums TypeScript fornecem type safety e validação em runtime.
 */

export enum UserRole {
  ADMIN = "ADMIN",
  TREASURER = "TREASURER",
  SECRETARY = "SECRETARY",
  MEMBER = "MEMBER",
}

export enum MemberStatus {
  ATIVO = "ATIVO",
  PROPOSTO = "PROPOSTO",
  ADORMECIDO = "ADORMECIDO",
}

export enum TipoAdmissao {
  INIC = "INIC", // Iniciação
  FILI = "FILI", // Filiação
  READ = "READ", // Readmissão
}

export enum EstadoCivil {
  SOLTEIRO = "SOLTEIRO",
  CASADO = "CASADO",
  DIVORCIADO = "DIVORCIADO",
  VIUVO = "VIUVO",
  UNIAO_ESTAVEL = "UNIAO_ESTAVEL",
}

export enum TipoSanguineo {
  A = "A",
  B = "B",
  AB = "AB",
  O = "O",
}

export enum FatorRh {
  POSITIVO = "POSITIVO",
  NEGATIVO = "NEGATIVO",
}

export enum Escolaridade {
  OUTRO = "OUTRO",
  PRIMEIRO_GRAU = "PRIMEIRO_GRAU",
  SEGUNDO_GRAU = "SEGUNDO_GRAU",
  TERCEIRO_GRAU = "TERCEIRO_GRAU",
  POS_GRADUACAO = "POS_GRADUACAO",
  MESTRADO = "MESTRADO",
  DOUTORADO = "DOUTORADO",
  ESPECIALIZACAO = "ESPECIALIZACAO",
}

export enum UnidadeFederativa {
  AC = "AC",
  AL = "AL",
  AP = "AP",
  AM = "AM",
  BA = "BA",
  CE = "CE",
  DF = "DF",
  ES = "ES",
  GO = "GO",
  MA = "MA",
  MT = "MT",
  MS = "MS",
  MG = "MG",
  PA = "PA",
  PB = "PB",
  PR = "PR",
  PE = "PE",
  PI = "PI",
  RJ = "RJ",
  RN = "RN",
  RS = "RS",
  RO = "RO",
  RR = "RR",
  SC = "SC",
  SP = "SP",
  SE = "SE",
  TO = "TO",
}

// Labels/descrições para uso na UI
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.TREASURER]: "Tesoureiro",
  [UserRole.SECRETARY]: "Secretário",
  [UserRole.MEMBER]: "Membro",
};

export const MemberStatusLabels: Record<MemberStatus, string> = {
  [MemberStatus.ATIVO]: "Ativo",
  [MemberStatus.PROPOSTO]: "Proposto",
  [MemberStatus.ADORMECIDO]: "Adormecido",
};

export const TipoAdmissaoLabels: Record<TipoAdmissao, string> = {
  [TipoAdmissao.INIC]: "Iniciação",
  [TipoAdmissao.FILI]: "Filiação",
  [TipoAdmissao.READ]: "Readmissão",
};

export const EstadoCivilLabels: Record<EstadoCivil, string> = {
  [EstadoCivil.SOLTEIRO]: "Solteiro",
  [EstadoCivil.CASADO]: "Casado",
  [EstadoCivil.DIVORCIADO]: "Divorciado",
  [EstadoCivil.VIUVO]: "Viúvo",
  [EstadoCivil.UNIAO_ESTAVEL]: "União Estável",
};

export const FatorRhLabels: Record<FatorRh, string> = {
  [FatorRh.POSITIVO]: "+",
  [FatorRh.NEGATIVO]: "-",
};

export const EscolaridadeLabels: Record<Escolaridade, string> = {
  [Escolaridade.OUTRO]: "Outro",
  [Escolaridade.PRIMEIRO_GRAU]: "1° Grau",
  [Escolaridade.SEGUNDO_GRAU]: "2° Grau",
  [Escolaridade.TERCEIRO_GRAU]: "3° Grau",
  [Escolaridade.POS_GRADUACAO]: "Pós-Graduação",
  [Escolaridade.MESTRADO]: "Mestrado",
  [Escolaridade.DOUTORADO]: "Doutorado",
  [Escolaridade.ESPECIALIZACAO]: "Especialização",
};

export const UnidadeFederativaLabels: Record<UnidadeFederativa, string> = {
  [UnidadeFederativa.AC]: "Acre",
  [UnidadeFederativa.AL]: "Alagoas",
  [UnidadeFederativa.AP]: "Amapá",
  [UnidadeFederativa.AM]: "Amazonas",
  [UnidadeFederativa.BA]: "Bahia",
  [UnidadeFederativa.CE]: "Ceará",
  [UnidadeFederativa.DF]: "Distrito Federal",
  [UnidadeFederativa.ES]: "Espírito Santo",
  [UnidadeFederativa.GO]: "Goiás",
  [UnidadeFederativa.MA]: "Maranhão",
  [UnidadeFederativa.MT]: "Mato Grosso",
  [UnidadeFederativa.MS]: "Mato Grosso do Sul",
  [UnidadeFederativa.MG]: "Minas Gerais",
  [UnidadeFederativa.PA]: "Pará",
  [UnidadeFederativa.PB]: "Paraíba",
  [UnidadeFederativa.PR]: "Paraná",
  [UnidadeFederativa.PE]: "Pernambuco",
  [UnidadeFederativa.PI]: "Piauí",
  [UnidadeFederativa.RJ]: "Rio de Janeiro",
  [UnidadeFederativa.RN]: "Rio Grande do Norte",
  [UnidadeFederativa.RS]: "Rio Grande do Sul",
  [UnidadeFederativa.RO]: "Rondônia",
  [UnidadeFederativa.RR]: "Roraima",
  [UnidadeFederativa.SC]: "Santa Catarina",
  [UnidadeFederativa.SP]: "São Paulo",
  [UnidadeFederativa.SE]: "Sergipe",
  [UnidadeFederativa.TO]: "Tocantins",
};
