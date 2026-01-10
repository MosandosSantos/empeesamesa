import { NextRequest, NextResponse } from 'next/server';
import { getUserFromPayload, verifyAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { canAccessFinance, isLojaAdmin, isTesouraria } from '@/lib/roles';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const { id } = await params;

  try {
    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    if (!canAccessFinance(user.role)) {
      return NextResponse.json({ error: 'Voce nao tem permissao para acessar pagamentos' }, { status: 403 });
    }

    const needsLojaRestriction = isLojaAdmin(user.role) || isTesouraria(user.role);
    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: 'Usuario sem loja vinculada' }, { status: 403 });
    }

    // Buscar todos os pagamentos do membro
    const payments = await prisma.memberPayment.findMany({
      where: {
        tenantId: payload!.tenantId,
        memberId: id,
        ...(needsLojaRestriction ? { member: { lojaId: user.lojaId } } : {}),
      },
      include: {
        lancamento: {
          include: {
            categoria: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching member payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, error } = await verifyAuth(req);
  if (error) return error;

  const { id } = await params;

  try {
    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    if (!canAccessFinance(user.role)) {
      return NextResponse.json({ error: 'Voce nao tem permissao para registrar pagamentos' }, { status: 403 });
    }

    const needsLojaRestriction = isLojaAdmin(user.role) || isTesouraria(user.role);
    if (needsLojaRestriction && !user.lojaId) {
      return NextResponse.json({ error: 'Usuario sem loja vinculada' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[Payment API] ========================================');
    console.log('[Payment API] Request body (raw):', JSON.stringify(body, null, 2));
    console.log('[Payment API] ========================================');

    const {
      paymentType,
      referenceMonth,
      referenceYear,
      description,
      amount,
      paymentMethod,
      paymentDate,
      categoriaId,
    } = body;

    // Log detalhado de cada campo
    console.log('[Payment API] Extracted fields:');
    console.log('  - paymentType:', paymentType, '(type:', typeof paymentType, ')');
    console.log('  - referenceMonth:', referenceMonth, '(type:', typeof referenceMonth, ')');
    console.log('  - referenceYear:', referenceYear, '(type:', typeof referenceYear, ')');
    console.log('  - description:', description, '(type:', typeof description, ')');
    console.log('  - amount:', amount, '(type:', typeof amount, ')');
    console.log('  - paymentMethod:', paymentMethod, '(type:', typeof paymentMethod, ')');
    console.log('  - paymentDate:', paymentDate, '(type:', typeof paymentDate, ')');
    console.log('  - categoriaId:', categoriaId, '(type:', typeof categoriaId, ')');

    // Validação básica
    if (!paymentType || !description || !amount || !paymentMethod || !paymentDate || !categoriaId) {
      console.log('[Payment API] ❌ VALIDATION FAILED!');
      console.log('[Payment API] Field presence check:', {
        paymentType: !!paymentType,
        description: !!description,
        amount: !!amount,
        paymentMethod: !!paymentMethod,
        paymentDate: !!paymentDate,
        categoriaId: !!categoriaId,
      });
      console.log('[Payment API] Field values:', {
        paymentType,
        description,
        amount,
        paymentMethod,
        paymentDate,
        categoriaId,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Payment API] ✅ Validation passed!');

    // Verificar se o membro existe
    const member = await prisma.member.findFirst({
      where: {
        id,
        tenantId: payload!.tenantId,
        ...(needsLojaRestriction ? { lojaId: user.lojaId } : {}),
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Criar o lançamento e o pagamento em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar o lançamento financeiro
      const lancamento = await tx.lancamento.create({
        data: {
          tenantId: payload!.tenantId,
          tipo: 'RECEITA',
          categoriaId,
          descricao: description,
          valorPrevisto: amount,
          valorPago: amount,
          dataVencimento: new Date(paymentDate),
          dataPagamento: new Date(paymentDate),
          status: 'PAGO',
          formaPagamento: paymentMethod,
        },
      });

      // Criar o pagamento do membro
      const memberPayment = await tx.memberPayment.create({
        data: {
          tenantId: payload!.tenantId,
          memberId: id,
          lancamentoId: lancamento.id,
          paymentType,
          referenceMonth: referenceMonth || null,
          referenceYear: referenceYear || null,
          description,
          amount,
          paymentMethod,
          paymentDate: new Date(paymentDate),
          createdById: payload!.userId,
          createdByName: payload!.email,
        },
        include: {
          lancamento: {
            include: {
              categoria: true,
            },
          },
        },
      });

      return memberPayment;
    });

    console.log('[Payment API] 🎉 SUCCESS! Payment created:');
    console.log('  - MemberPayment ID:', result.id);
    console.log('  - MemberPayment.paymentMethod:', result.paymentMethod);
    console.log('  - Lancamento.formaPagamento:', result.lancamento.formaPagamento);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[Payment API] ❌ Error creating member payment:', error);
    if (error instanceof Error) {
      console.error('[Payment API] Error message:', error.message);
      console.error('[Payment API] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
