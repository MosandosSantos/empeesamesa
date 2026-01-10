import Link from "next/link";
import { cookies } from "next/headers";
import { Building2, Eye, Landmark, Pencil, Plus, Trash2, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { isLojaAdmin, isSecretaria, isTesouraria } from "@/lib/roles";

async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  return getUserFromPayload(payload);
}

export default async function PotenciasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role)) {
    redirect("/");
  }
  const tenantId = user?.tenantId ?? null;
  const where =
    user?.role === "ADMIN_POT" && user.potenciaId
      ? { id: user.potenciaId, tenantId }
      : tenantId
        ? { tenantId }
        : undefined;

  const potencias = await prisma.potencia.findMany({
    where,
    orderBy: { nome: "asc" },
    include: {
      _count: {
        select: {
          lojas: true,
        },
      },
    },
  });

  const lojasCount = await prisma.loja.count({
    where:
      user?.role === "ADMIN_POT" && user.potenciaId
        ? { potenciaId: user.potenciaId }
        : tenantId
          ? { tenantId }
          : undefined,
  });

  const membrosCount = await prisma.member.count({
    where:
      user?.role === "ADMIN_POT" && user.potenciaId
        ? { loja: { potenciaId: user.potenciaId } }
        : tenantId
          ? { tenantId }
          : undefined,
  });

  const potenciasCount = await prisma.potencia.count({ where });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Prefeituras</h1>
          <p className="text-sm text-muted-foreground">
            Lista de prefeituras cadastradas e lojas vinculadas.
          </p>
        </div>
        {(user?.role === "ADMIN_SAAS" || user?.role === "SYS_ADMIN") && (
          <Link
            href="/potencias/novo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
          >
            <Plus size={16} className="text-primary-foreground" aria-hidden />
            <span>Incluir prefeitura</span>
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          titulo="Total de prefeituras"
          valor={potenciasCount}
          icon={<Landmark size={18} />}
          tone="emerald"
        />
        <InfoCard
          titulo="Total de lojas"
          valor={lojasCount}
          icon={<Building2 size={18} />}
          tone="teal"
        />
        <InfoCard
          titulo="Total de membros"
          valor={membrosCount}
          icon={<Users size={18} />}
          tone="olive"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#3b4d3b] text-white">
              <tr>
                <Th>Nome</Th>
                <Th>Sigla</Th>
                <Th>Cidade/UF</Th>
                <Th>E-mail</Th>
                <Th>Telefone</Th>
                <Th className="text-right">Lojas</Th>
                <Th className="text-right">{"A\u00e7\u00f5es"}</Th>
              </tr>
            </thead>
            <tbody>
              {potencias.map((p, index) => (
                <tr key={p.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f1fffb]"}>
                  <Td>
                    <div className="font-medium text-foreground">{p.nome}</div>
                  </Td>
                  <Td>{p.sigla || "-"}</Td>
                  <Td>
                    {p.enderecoCidade && p.enderecoUf
                      ? `${p.enderecoCidade} / ${p.enderecoUf}`
                      : p.enderecoCidade || p.enderecoUf || "-"}
                  </Td>
                  <Td>{p.email || "-"}</Td>
                  <Td>{p.telefone || "-"}</Td>
                  <Td className="text-right">{p._count.lojas}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <IconLink href={`/potencias/${p.id}`} label="Visualizar" icon={<Eye size={16} />} />
                      {(user?.role === "ADMIN_SAAS" || user?.role === "SYS_ADMIN") && (
                        <>
                          <IconLink href={`/potencias/${p.id}/editar`} label="Editar" icon={<Pencil size={16} />} />
                          <IconLink
                            href={`/potencias/${p.id}/excluir`}
                            label="Excluir"
                            icon={<Trash2 size={16} />}
                            tone="danger"
                          />
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {potencias.length === 0 && (
                <tr>
                  <Td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhuma prefeitura cadastrada.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  titulo,
  valor,
  icon,
  tone,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
  tone: "emerald" | "teal" | "olive";
}) {
  const toneStyles = {
    emerald: "from-emerald-50/80 via-white to-white text-emerald-700 border-emerald-200",
    teal: "from-teal-50/80 via-white to-white text-teal-700 border-teal-200",
    olive: "from-green-50/80 via-white to-white text-green-700 border-green-200",
  };
  return (
    <div
      className={`rounded-lg border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneStyles[tone]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white ${toneStyles[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold text-foreground">{valor}</p>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-3 py-2 align-middle text-xs text-foreground ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function IconLink({
  href,
  label,
  icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const toneClass = tone === "danger" ? "text-red-600" : "text-foreground";
  return (
    <Link
      href={href}
      className={`flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-xs font-semibold shadow-sm transition hover:shadow-md ${toneClass}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </Link>
  );
}
