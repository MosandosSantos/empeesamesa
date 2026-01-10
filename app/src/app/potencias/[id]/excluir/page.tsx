import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";

type FormState = { error: string | null };

async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  return getUserFromPayload(payload);
}

export default async function ExcluirPotenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const tenantId = user?.tenantId ?? null;

  const potencia = await prisma.potencia.findFirst({
    where: { id, ...(tenantId ? { tenantId } : {}) },
    include: {
      _count: {
        select: { lojas: true },
      },
    },
  });

  if (!potencia) {
    notFound();
  }

  if (user?.role !== "ADMIN_SAAS" && user?.role !== "SYS_ADMIN") {
    redirect(`/potencias/${potencia.id}`);
  }

  async function deletePotencia(_: FormState, _formData: FormData): Promise<FormState> {
    "use server";

    const userInner = await getCurrentUser();
    if (!userInner) {
      return { error: "N\u00e3o autorizado." };
    }
    if (userInner.role !== "ADMIN_SAAS" && userInner.role !== "SYS_ADMIN") {
      return { error: "Sem permiss\u00e3o para excluir prefeitura." };
    }

    if (potencia._count.lojas > 0) {
      return { error: "N\u00e3o \u00e9 poss\u00edvel excluir uma prefeitura com lojas vinculadas." };
    }

    await prisma.potencia.delete({ where: { id: potencia.id } });
    redirect("/potencias");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {"Confirma\u00e7\u00e3o"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Excluir prefeitura</h1>
        <p className="text-sm text-muted-foreground">
          {"Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita."}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-foreground">
          Tem certeza que deseja excluir a prefeitura{" "}
          <span className="font-semibold">{potencia.nome}</span>?
        </p>
        {potencia._count.lojas > 0 && (
          <p className="mt-2 text-sm text-red-600">
            Esta prefeitura possui {potencia._count.lojas} loja(s) vinculada(s).
          </p>
        )}

        <form action={deletePotencia} className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Excluir
          </button>
          <Link
            href="/potencias"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Cancelar
          </Link>
        </form>
      </div>
    </div>
  );
}

