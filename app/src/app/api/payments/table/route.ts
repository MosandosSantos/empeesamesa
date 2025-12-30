import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, getUserFromPayload } from "@/lib/api-auth";
import { getPaymentsTable } from "@/lib/payments/services";
import { PeriodType } from "@/lib/validations/payments";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments/table?type=MONTHLY|ANNUAL
 *
 * Retorna dados estruturados para a tabela de pagamentos
 *
 * Permissões:
 * - SYS_ADMIN: pode ver qualquer tenant (com tenantId na query)
 * - LODGE_ADMIN: vê apenas sua loja
 * - MEMBER: vê apenas seus próprios pagamentos
 */
export async function GET(request: NextRequest) {
  const { payload, error } = await verifyAuth(request);
  if (error) return error;

  const user = await getUserFromPayload(payload!);
  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const typeParam = searchParams.get("type");
  const tenantIdParam = searchParams.get("tenantId");

  if (!typeParam || ![PeriodType.MONTHLY, PeriodType.ANNUAL, PeriodType.EVENT].includes(typeParam)) {
    return NextResponse.json(
      { error: "Parâmetro 'type' inválido" },
      { status: 400 }
    );
  }

  let effectiveTenantId = user.tenantId;
  if (user.role === "SYS_ADMIN" && tenantIdParam) {
    effectiveTenantId = tenantIdParam;
  }

  let memberId: string | undefined = undefined;
  if (user.role === "MEMBER") {
    const member = await prisma.member.findFirst({
      where: { tenantId: effectiveTenantId, email: user.email },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Perfil de membro não encontrado" },
        { status: 404 }
      );
    }

    memberId = member.id;
  }

  try {
    const data = await getPaymentsTable(effectiveTenantId, typeParam, {
      memberId,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro ao buscar tabela de pagamentos:", err);
    return NextResponse.json(
      { error: "Erro ao buscar dados de pagamentos" },
      { status: 500 }
    );
  }
}
