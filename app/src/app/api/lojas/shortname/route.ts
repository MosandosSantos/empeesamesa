import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getUserFromPayload } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const value = (searchParams.get("value") || "").trim();

  if (value.length < 3) {
    return NextResponse.json({ available: false, reason: "length" });
  }

  const existingShortName = await prisma.loja.findFirst({
    where: {
      shortName: { equals: value, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existingShortName) {
    return NextResponse.json({ available: false, reason: "shortName" });
  }

  const isSaasAdmin = user.role === "SYS_ADMIN" || user.role === "ADMIN_SAAS";
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      name: { equals: value, mode: "insensitive" },
      ...(isSaasAdmin ? {} : { id: { not: user.tenantId } }),
    },
    select: { id: true },
  });

  if (existingTenant) {
    return NextResponse.json({ available: false, reason: "tenant" });
  }

  return NextResponse.json({ available: true });
}
