export type UserRole =
  | "SYS_ADMIN"
  | "ADMIN_SAAS"
  | "ADMIN_POT"
  | "ADMIN_LOJA"
  | "SECRETARIO_LOJA"
  | "TESOUREIRO"
  | "LODGE_ADMIN"
  | "SECRETARY"
  | "FINANCE"
  | "ADMIN"
  | "MEMBER";

const ROLE_GROUPS = {
  saasAdmin: new Set<UserRole>(["SYS_ADMIN", "ADMIN_SAAS"]),
  lojaAdmin: new Set<UserRole>(["ADMIN_LOJA", "LODGE_ADMIN", "ADMIN"]),
  secretaria: new Set<UserRole>(["SECRETARIO_LOJA", "SECRETARY"]),
  tesouraria: new Set<UserRole>(["TESOUREIRO", "FINANCE"]),
};

export function isSaasAdmin(role: UserRole | null | undefined) {
  return role ? ROLE_GROUPS.saasAdmin.has(role) : false;
}

export function isSysAdmin(role: UserRole | null | undefined) {
  return role === "SYS_ADMIN";
}

export function isLojaAdmin(role: UserRole | null | undefined) {
  return role ? ROLE_GROUPS.lojaAdmin.has(role) : false;
}

export function isPotAdmin(role: UserRole | null | undefined) {
  return role === "ADMIN_POT";
}

export function isSecretaria(role: UserRole | null | undefined) {
  return role ? ROLE_GROUPS.secretaria.has(role) : false;
}

export function isTesouraria(role: UserRole | null | undefined) {
  return role ? ROLE_GROUPS.tesouraria.has(role) : false;
}

export function canManageMembers(role: UserRole | null | undefined) {
  return isLojaAdmin(role) || isSecretaria(role);
}

export function canDeleteMembers(role: UserRole | null | undefined) {
  return isLojaAdmin(role) || isSecretaria(role);
}

export function canViewMembers(role: UserRole | null | undefined) {
  return (
    isSaasAdmin(role) ||
    isPotAdmin(role) ||
    isLojaAdmin(role) ||
    isSecretaria(role) ||
    isTesouraria(role) ||
    role === "MEMBER"
  );
}

export function canAccessFinance(role: UserRole | null | undefined) {
  return isSaasAdmin(role) || isLojaAdmin(role) || isTesouraria(role);
}

export function canAccessPresence(role: UserRole | null | undefined) {
  return isSaasAdmin(role) || isLojaAdmin(role) || isSecretaria(role);
}
