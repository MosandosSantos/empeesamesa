/**
 * Payment Grid API - Sprint Pagamentos
 *
 * Endpoint para buscar dados agregados de pagamentos em formato grid.
 * GET /api/payments/grid?type=MONTHLY|ANNUAL&year=2025
 *
 * Access Control:
 * - ADMIN/TREASURER: Vê todos os membros do tenant
 * - MEMBER: Vê apenas próprio registro
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getPaymentGrid } from '@/lib/payments/payment-aggregator';

export async function GET(req: NextRequest) {
  // 1. Autenticação
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  // 2. Parâmetros
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') as 'MONTHLY' | 'ANNUAL' | null;
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const lojaId = searchParams.get('lojaId') || undefined;

  // 3. Validação
  if (!type || !['MONTHLY', 'ANNUAL'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid type parameter. Must be MONTHLY or ANNUAL' },
      { status: 400 }
    );
  }

  // 4. Access Control - Buscar role do User
  // IMPORTANTE: JWTPayload não tem role, precisa buscar do banco
  const user = await prisma.user.findUnique({
    where: { id: payload!.userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  let onlyMemberId: string | undefined;

  // Se usuário é MEMBER, buscar seu memberProfile e restringir
  if (user.role === 'MEMBER') {
    const memberProfile = await prisma.member.findFirst({
      where: {
        tenantId: payload!.tenantId,
        // Assumindo que email vincula User -> Member
        email: payload!.email,
      },
      select: { id: true },
    });

    if (!memberProfile) {
      return NextResponse.json(
        { error: 'Member profile not found for this user' },
        { status: 404 }
      );
    }

    onlyMemberId = memberProfile.id;
  }

  // 5. Buscar grid data
  try {
    const gridData = await getPaymentGrid({
      tenantId: payload!.tenantId,
      type,
      year,
      lojaId,
      onlyMemberId,
    });

    return NextResponse.json(gridData);
  } catch (err) {
    console.error('[Payment Grid API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch payment grid' },
      { status: 500 }
    );
  }
}
