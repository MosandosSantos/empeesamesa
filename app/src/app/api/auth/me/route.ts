import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name ?? "SAL GOISC",
      },
    });
  } catch (error) {
    console.error("Me route error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
