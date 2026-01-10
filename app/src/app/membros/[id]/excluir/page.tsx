import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { canDeleteMembers, isLojaAdmin } from "@/lib/roles";
import DeleteMemberForm from "./delete-form";

export default async function ExcluirMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!canDeleteMembers(user.role)) {
    redirect("/membros");
  }

  const needsLojaRestriction = isLojaAdmin(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    redirect("/membros");
  }

  const member = await prisma.member.findUnique({
    where: {
      id,
      tenantId: user.tenantId,
      ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
    },
    select: {
      id: true,
      nomeCompleto: true,
      situacao: true,
      class: true,
      email: true,
    },
  });

  if (!member) {
    notFound();
  }

  return <DeleteMemberForm member={member} />;
}
