import prisma from "@/lib/prisma";
import PresencaClient from "./page-client";

export default async function PresencaPage() {
  const meetings = await prisma.meeting.findMany({
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
