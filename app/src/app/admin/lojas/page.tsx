import prisma from "@/lib/prisma";
import LojasTable, { type LojaRow } from "./lojas-table";

async function fetchLojas(): Promise<{ rows: LojaRow[]; stats: { total: number; ativas: number; vencidas: number } }> {
  const now = new Date();
  const lojas = await prisma.loja.findMany({
    include: {
      tenant: { select: { id: true, name: true } },
      potencia: { select: { nome: true } },
    },
    orderBy: [{ tenantId: "asc" }, { lojaMX: "asc" }],
  });

  const rows: LojaRow[] = lojas.map((loja) => {
    const vencida = loja.mensalidadeValidaAte !== null && loja.mensalidadeValidaAte.getTime() < now.getTime();
    const ativa = loja.mensalidadeAtiva && !vencida;
    return {
      id: loja.id,
      nome: loja.lojaMX,
      numero: loja.numero ?? undefined,
      tenantName: loja.tenant.name,
      tenantId: loja.tenant.id,
      potencia: loja.potencia?.nome,
      contrato: loja.contractNumber,
      contatoNome: loja.contatoNome,
      telefone: loja.telefone,
      situacao: loja.situacao,
      status: ativa ? "ATIVA" : vencida ? "VENCIDA" : "SUSPENSA",
      validade: loja.mensalidadeValidaAte ? loja.mensalidadeValidaAte.toISOString() : null,
      cidadeUf:
        loja.enderecoCidade && loja.enderecoUf
          ? `${loja.enderecoCidade} / ${loja.enderecoUf}`
          : loja.enderecoCidade || loja.enderecoUf || "-",
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
  const { rows, stats } = await fetchLojas();

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

      <LojasTable lojas={rows} stats={stats} />
    </div>
  );
}
