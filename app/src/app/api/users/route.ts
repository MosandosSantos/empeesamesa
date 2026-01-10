import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getUserFromPayload } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { createUserSchema } from '@/lib/validations/user';
import { createInviteToken, INVITE_TOKEN_EXPIRY_HOURS } from '@/lib/invite-token';
import { sendEmail, createInviteEmailTemplate } from '@/lib/email';
import { isSaasAdmin } from '@/lib/roles';

/**
 * GET /api/users
 * Lista todos os usuários (filtrado por tenant e loja do usuário)
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await getUserFromPayload(auth);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: auth.tenantId,
        // SYS_ADMIN vê todos, outros veem apenas da sua loja
        ...(auth.role !== 'SYS_ADMIN' && auth.lojaId
          ? { lojaId: auth.lojaId }
          : {}),
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Não retornar passwordHash
    const sanitizedUsers = users.map((user) => ({
      ...user,
      passwordHash: undefined,
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Cria um novo usuário e envia email de convite
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Apenas SYS_ADMIN pode criar usuários
  if (auth.role !== 'SYS_ADMIN') {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem criar usuários' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: auth.tenantId,
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 400 }
      );
    }

    // Verificar se a loja existe
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

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        tenantId: auth.tenantId,
        email: validatedData.email,
        lojaId: validatedData.lojaId,
        role: validatedData.role,
        status: 'INVITED',
        createdByUserId: auth.userId,
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

    // Gerar token de convite
    const token = await createInviteToken(user.id);

    // Gerar link de convite
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/auth/set-password?token=${token}`;

    // Enviar email
    const emailHtml = createInviteEmailTemplate({
      userName: user.email.split('@')[0],
      inviteLink,
      expiresInHours: INVITE_TOKEN_EXPIRY_HOURS,
    });

    await sendEmail({
      to: user.email,
      subject: 'Convite - EsferaORDO',
      html: emailHtml,
    });

    // Retornar usuário sem passwordHash
    return NextResponse.json(
      {
        ...user,
        passwordHash: undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
