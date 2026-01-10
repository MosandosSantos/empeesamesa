import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { canManageMembers, isLojaAdmin, isSecretaria } from "@/lib/roles";
import EditMemberForm from "./edit-member-form";

export const dynamic = "force-dynamic";

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const member = await prisma.member.findUnique({
    where: {
      id,
      tenantId: user.tenantId,
      ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
    },
  });

  if (!member) {
    notFound();
  }

  return <EditMemberForm member={member} />;
}
