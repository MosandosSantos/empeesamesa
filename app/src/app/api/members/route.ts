import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, getUserFromPayload } from "@/lib/api-auth";
import prisma from "@/lib/prisma";
import { canViewMembers, isLojaAdmin, isPotAdmin, isSecretaria, isTesouraria } from "@/lib/roles";

// GET /api/members - List members
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserFromPayload(auth);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canViewMembers(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const needsLojaRestriction = isLojaAdmin(user.role) || isSecretaria(user.role) || isTesouraria(user.role);
    const needsPotRestriction = isPotAdmin(user.role);

    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: "User missing lodge scope" }, { status: 403 });
    }

    if (needsPotRestriction && !user.potenciaId) {
      return NextResponse.json({ error: "User missing potency scope" }, { status: 403 });
    }

    const where: {
      tenantId: string;
      situacao?: string;
      lojaId?: string;
      loja?: { potenciaId: string };
    } = {
      tenantId: auth.tenantId,
    };

    if (status) {
      where.situacao = status;
    }

    if (needsLojaRestriction) {
      where.lojaId = user.lojaId ?? undefined;
    }

    if (needsPotRestriction && user.potenciaId) {
      where.loja = { potenciaId: user.potenciaId };
    }

    const members = await prisma.member.findMany({
      where,
      select: {
        id: true,
        nomeCompleto: true,
        class: true,
        situacao: true,
        email: true,
      },
      orderBy: {
        nomeCompleto: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
