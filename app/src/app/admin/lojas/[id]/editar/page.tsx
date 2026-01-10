import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import EditLojaForm from "./edit-loja-form";
import { getCurrentUser } from "@/lib/server-auth";

export default async function EditarLojaPage({
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

  const lojaData = {
    ...loja,
    valorMensalidade: loja.valorMensalidade ? Number(loja.valorMensalidade) : null,
    mensalidadeRegular: loja.mensalidadeRegular ? Number(loja.mensalidadeRegular) : null,
    mensalidadeFiliado: loja.mensalidadeFiliado ? Number(loja.mensalidadeFiliado) : null,
    mensalidadeRemido: loja.mensalidadeRemido ? Number(loja.mensalidadeRemido) : null,
  };

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

  return <EditLojaForm loja={lojaData} potencias={potencias} ritos={ritos} />;
}
