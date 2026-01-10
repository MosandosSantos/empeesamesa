import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import LojasTable, { type LojaRow } from "./lojas-table";
import { getCurrentUser } from "@/lib/server-auth";
import { isLojaAdmin, isPotAdmin, isSecretaria, isTesouraria, isSysAdmin } from "@/lib/roles";

async function fetchLojas(user: { tenantId: string; lojaId?: string | null; potenciaId?: string | null; role: string }): Promise<{ rows: LojaRow[]; stats: { total: number; ativas: number; vencidas: number } }> {
  const now = new Date();
  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
  const needsPotRestriction = user.role === "ADMIN_POT";

  if (needsLojaRestriction && !user.lojaId) {
    return { rows: [], stats: { total: 0, ativas: 0, vencidas: 0 } };
  }

  if (needsPotRestriction && !user.potenciaId) {
    return { rows: [], stats: { total: 0, ativas: 0, vencidas: 0 } };
  }
  const lojas = await prisma.loja.findMany({
    where: {
      tenantId: user.tenantId,
      ...(needsLojaRestriction ? { id: user.lojaId ?? undefined } : {}),
      ...(needsPotRestriction ? { potenciaId: user.potenciaId ?? undefined } : {}),
    },
    include: {
      tenant: { select: { id: true, name: true } },
      potencia: { select: { sigla: true } },
      rito: { select: { sigla: true, nome: true } },
      _count: { select: { members: true } },
    },
    orderBy: [{ tenantId: "asc" }, { lojaMX: "asc" }],
  });

  const rows: LojaRow[] = lojas.map((loja) => {
    const status = loja.mensalidadeAtiva ? "ATIVA" : "SUSPENSA";
    return {
      id: loja.id,
      nome: loja.lojaMX,
      numero: loja.numero ?? undefined,
      tenantName: loja.tenant.name,
      shortName: loja.shortName,
      tenantId: loja.tenant.id,
      potencia: loja.potencia?.sigla,
      rito: loja.rito?.sigla || loja.rito?.nome || null,
      contrato: loja.contractNumber,
      contatoNome: loja.contatoNome,
      telefone: loja.telefone,
      enderecoNumero: loja.enderecoNumero,
      enderecoComplemento: loja.enderecoComplemento,
      situacao: loja.situacao,
      status: status,
      validade: loja.mensalidadeVencimentoDia ? `Dia ${loja.mensalidadeVencimentoDia}` : null,
      totalMembros: loja._count.members,
    };
  });

  const stats = {
    total: rows.length,
    ativas: rows.filter((r) => r.status === "ATIVA").length,
    vencidas: rows.filter((r) => r.status === "VENCIDA").length,
  };

  return { rows, stats };
}

export default async function AdminLojasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const canCreate = isSysAdmin(user.role) || isPotAdmin(user.role);
  const canEdit = isSysAdmin(user.role) || isLojaAdmin(user.role) || isPotAdmin(user.role);
  const canDelete = isSysAdmin(user.role) || isLojaAdmin(user.role) || isPotAdmin(user.role);
  const { rows, stats } = await fetchLojas(user);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Administração do SaaS</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Lojas e contratos</h1>
          <p className="text-sm text-muted-foreground">
            Cada loja tem contrato e status de mensalidade próprios. Somente lojas ativas aparecem no cadastro de membros.
          </p>
        </div>
      </div>

      <LojasTable
        lojas={rows}
        stats={stats}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
