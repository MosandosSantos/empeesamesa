import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getUserFromPayload } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { isSaasAdmin } from '@/lib/roles';
import { updateUserSchema } from '@/lib/validations/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * Busca um usuário específico
 */
export async function GET(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
      include: {
        loja: {
          select: {
            id: true,
            lojaMX: true,
            numero: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não retornar passwordHash
    return NextResponse.json({
      ...user,
      passwordHash: undefined,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Atualiza um usuário
 */
export async function PUT(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Apenas SYS_ADMIN pode editar usuários
  if (auth.role !== 'SYS_ADMIN') {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem editar usuários' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Verificar se usuário existe
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se mudando email, verificar se já existe
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          tenantId: auth.tenantId,
          email: validatedData.email,
          id: { not: params.id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email' },
          { status: 400 }
        );
      }
    }

    // Se mudando loja, verificar se existe
    if (validatedData.lojaId) {
      const loja = await prisma.loja.findFirst({
        where: {
          id: validatedData.lojaId,
          tenantId: auth.tenantId,
        },
      });

      if (!loja) {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 }
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedByUserId: auth.userId,
      },
      include: {
        loja: {
          select: {
            id: true,
            lojaMX: true,
            numero: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedUser,
      passwordHash: undefined,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Remove um usuário
 */
export async function DELETE(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Apenas SYS_ADMIN pode deletar usuários
  if (auth.role !== 'SYS_ADMIN') {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem deletar usuários' },
      { status: 403 }
    );
  }

  try {
    // Verificar se usuário existe
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir deletar a si mesmo
    if (params.id === auth.userId) {
      return NextResponse.json(
        { error: 'Você não pode deletar seu próprio usuário' },
        { status: 400 }
      );
    }

    // Deletar usuário (cascade vai deletar tokens)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    );
  }
}
