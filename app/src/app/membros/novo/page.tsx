import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { canManageMembers, isLojaAdmin, isSecretaria } from "@/lib/roles";
import { NewMemberForm, type LojaOption } from "./new-member-form";

export default async function NovoMembroPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!canManageMembers(user.role)) {
    redirect("/membros");
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    redirect("/membros");
  }

  const activeLojas = await prisma.loja.findMany({
    where: {
      mensalidadeAtiva: true,
      ...(needsLojaRestriction ? { id: user.lojaId } : {}),
    },
    orderBy: [{ lojaMX: "asc" }],
    select: {
      id: true,
      tenantId: true,
      lojaMX: true,
      numero: true,
      contractNumber: true,
      mensalidadeVencimentoDia: true,
      enderecoCidade: true,
      enderecoUf: true,
    },
  });

  const lojaOptions: LojaOption[] = activeLojas.map((loja) => ({
    id: loja.id,
    label: loja.lojaMX ?? "Sem nome",
    numero: loja.numero ?? null,
    contractNumber: loja.contractNumber,
    validade: loja.mensalidadeVencimentoDia
      ? `Dia ${loja.mensalidadeVencimentoDia}`
      : null,
    cidadeUf:
      loja.enderecoCidade && loja.enderecoUf
        ? `${loja.enderecoCidade} / ${loja.enderecoUf}`
        : loja.enderecoCidade || loja.enderecoUf || undefined,
  }));

  return <NewMemberForm lojas={lojaOptions} />;
}
