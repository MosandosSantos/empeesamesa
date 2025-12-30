import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditLojaForm from "./edit-loja-form";

export default async function EditarLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const loja = await prisma.loja.findUnique({
    where: { id },
    include: {
      potencia: {
        select: {
          id: true,
          nome: true,
        },
      },
      rito: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!loja) {
    notFound();
  }

  // Buscar lista de potências e ritos para os selects
  const potencias = await prisma.potencia.findMany({
    select: {
      id: true,
      nome: true,
      sigla: true,
    },
    orderBy: { nome: "asc" },
  });

  const ritos = await prisma.rito.findMany({
    select: {
      id: true,
      nome: true,
      sigla: true,
    },
    orderBy: { nome: "asc" },
  });

  return <EditLojaForm loja={loja} potencias={potencias} ritos={ritos} />;
}
