import prisma from "@/lib/prisma";
import { NewMemberForm, type LojaOption } from "./new-member-form";

export default async function NovoMembroPage() {
  const now = new Date();
  const activeLojas = await prisma.loja.findMany({
    where: {
      mensalidadeAtiva: true,
      OR: [{ mensalidadeValidaAte: null }, { mensalidadeValidaAte: { gte: now } }],
    },
    orderBy: [{ lojaMX: "asc" }],
    select: {
      id: true,
      tenantId: true,
      lojaMX: true,
      numero: true,
      contractNumber: true,
      mensalidadeValidaAte: true,
      enderecoCidade: true,
      enderecoUf: true,
    },
  });

  const lojaOptions: LojaOption[] = activeLojas.map((loja) => ({
    id: loja.id,
    tenantId: loja.tenantId,
    label: loja.lojaMX ?? "Sem nome",
    numero: loja.numero ?? null,
    contractNumber: loja.contractNumber,
    validade: loja.mensalidadeValidaAte ? loja.mensalidadeValidaAte.toISOString() : null,
    cidadeUf:
      loja.enderecoCidade && loja.enderecoUf
        ? `${loja.enderecoCidade} / ${loja.enderecoUf}`
        : loja.enderecoCidade || loja.enderecoUf || undefined,
  }));

  return <NewMemberForm lojas={lojaOptions} />;
}
