import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";
import { canAccessPresence, isLojaAdmin, isSecretaria } from "@/lib/roles";
import PresencaClient from "./page-client";

export default async function PresencaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!canAccessPresence(user.role)) {
    redirect("/");
  }

  const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role);
  if (needsLojaRestriction && !user.lojaId) {
    redirect("/");
  }

  const meetings = await prisma.meeting.findMany({
    where: {
      ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
    },
    include: {
      loja: {
        select: {
          lojaMX: true,
          numero: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: {
      dataSessao: "desc",
    },
    take: 50,
  });

  return <PresencaClient initialMeetings={meetings} />;
}
