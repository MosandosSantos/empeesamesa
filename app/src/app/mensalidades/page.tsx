"use client";

import { canAccessFinance } from "@/lib/roles";
import { useRoleGuard } from "@/lib/use-role-guard";

export default function MensalidadesPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Mensalidades
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle de pagamento de mensalidades
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Página de mensalidades - em desenvolvimento
        </p>
      </div>
    </div>
  );
}
