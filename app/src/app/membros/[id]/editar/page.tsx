import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import EditMemberForm from "./edit-member-form";

export const dynamic = "force-dynamic";

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value ?? null;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    redirect("/login");
  }

  const member = await prisma.member.findUnique({
    where: { id, tenantId: payload.tenantId },
  });

  if (!member) {
    notFound();
  }

  return <EditMemberForm member={member} />;
}
