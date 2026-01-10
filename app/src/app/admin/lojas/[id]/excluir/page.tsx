import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DeleteLojaForm from "./delete-form";
import { getCurrentUser } from "@/lib/server-auth";

export default async function ExcluirLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "ADMIN_SAAS") {
    redirect("/admin/lojas");
  }

  const { id } = await params;

  const loja = await prisma.loja.findUnique({
    where: { id },
    select: {
      id: true,
      lojaMX: true,
      numero: true,
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      situacao: true,
      contractNumber: true,
      contatoNome: true,
      telefone: true,
      enderecoCidade: true,
      enderecoUf: true,
      mensalidadeVencimentoDia: true,
    },
  });

  if (!loja) {
    notFound();
  }

  const cidadeUf =
    loja.enderecoCidade && loja.enderecoUf
      ? `${loja.enderecoCidade} / ${loja.enderecoUf}`
      : loja.enderecoCidade || loja.enderecoUf || "-";

  return (
    <DeleteLojaForm
      loja={{
        id: loja.id,
        nome: loja.lojaMX ?? "Sem nome",
        numero: loja.numero ?? undefined,
        tenantName: loja.tenant.name,
        situacao: loja.situacao,
        contrato: loja.contractNumber,
        contatoNome: loja.contatoNome ?? "-",
        telefone: loja.telefone ?? "-",
        cidadeUf,
        validade: loja.mensalidadeVencimentoDia ? `Dia ${loja.mensalidadeVencimentoDia}` : null,
      }}
    />
  );
}
