import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DeleteMemberForm from "./delete-form";

export default async function ExcluirMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
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
