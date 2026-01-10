import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getUserFromPayload } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { isSaasAdmin } from '@/lib/roles';
import {
  createInviteToken,
  invalidateUserTokens,
  INVITE_TOKEN_EXPIRY_HOURS,
} from '@/lib/invite-token';
import { sendEmail, createInviteEmailTemplate } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/users/[id]/resend-invite
 * Reenvia email de convite para um usuário
 */
export async function POST(req: NextRequest, props: RouteParams) {
  const params = await props.params;
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const currentUser = await getUserFromPayload(auth);
  if (!currentUser) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  // Apenas administradores do sistema podem reenviar convites
  if (!isSaasAdmin(currentUser.role)) {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem reenviar convites' },
      { status: 403 }
    );
  }

  try {
    // Buscar usuário
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenantId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se usuário já definiu senha
    if (user.status === 'ACTIVE' && user.passwordHash) {
      return NextResponse.json(
        { error: 'Usuário já definiu senha e está ativo' },
        { status: 400 }
      );
    }

    // Invalidar tokens anteriores
    await invalidateUserTokens(user.id);

    // Gerar novo token
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
      subject: 'Novo Convite - EsferaORDO',
      html: emailHtml,
    });

    return NextResponse.json({
      message: 'Convite reenviado com sucesso',
      email: user.email,
    });
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    return NextResponse.json(
      { error: 'Erro ao reenviar convite' },
      { status: 500 }
    );
  }
}
