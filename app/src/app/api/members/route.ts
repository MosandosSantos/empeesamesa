import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/members - List members
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {
      tenantId: auth.tenantId,
    };

    if (status) {
      where.situacao = status;
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
