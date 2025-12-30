/**
 * Helper para criar usuários e enviar convites por email
 */

import { prisma } from "@/lib/prisma";
import { createInviteToken } from "@/lib/invite-token";
import { sendEmail, createInviteEmailTemplate } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export interface CreateUserAndInviteParams {
  email: string;
  tenantId: string;
  lojaId?: string | null;
  role?: "SYS_ADMIN" | "LODGE_ADMIN" | "SECRETARY" | "FINANCE" | "MEMBER";
  createdByUserId?: string;
  userName?: string; // Nome para o email de boas-vindas
}

/**
 * Cria um usuário (se não existir) e envia convite por email
 */
export async function createUserAndInvite(
  params: CreateUserAndInviteParams
): Promise<{ userId: string; userCreated: boolean; inviteSent: boolean }> {
  const {
    email,
    tenantId,
    lojaId = null,
    role = "MEMBER",
    createdByUserId,
    userName = email.split("@")[0],
  } = params;

  // Verificar se usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: email.toLowerCase(),
      },
    },
  });

  let userId: string;
  let userCreated = false;

  if (existingUser) {
    // Usuário já existe
    userId = existingUser.id;
    console.log(`[User Invite] Usuário já existe: ${email}`);
  } else {
    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        tenantId,
        lojaId,
        email: email.toLowerCase(),
        passwordHash: null, // Senha será definida via token
        role,
        status: "INVITED",
        createdByUserId,
      },
    });

    userId = newUser.id;
    userCreated = true;
    console.log(`[User Invite] Usuário criado: ${email} (${userId})`);
  }

  // Gerar token de convite
  const { token } = await createInviteToken(userId);

  // Criar link de convite
  const inviteLink = `${BASE_URL}/auth/set-password?token=${token}`;

  // Enviar email de convite
  await sendEmail({
    to: email,
    subject: "Convite - EsferaORDO | Defina sua senha",
    html: createInviteEmailTemplate({
      userName,
      inviteLink,
      expiresInHours: 48,
    }),
  });

  console.log(`[User Invite] Email de convite enviado para: ${email}`);

  return {
    userId,
    userCreated,
    inviteSent: true,
  };
}

/**
 * Reenvia convite para um usuário existente
 */
export async function resendInvite(
  userId: string
): Promise<{ inviteSent: boolean }> {
  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (user.status !== "INVITED") {
    throw new Error("Usuário já ativado");
  }

  // Gerar novo token de convite
  const { token } = await createInviteToken(userId);

  // Criar link de convite
  const inviteLink = `${BASE_URL}/auth/set-password?token=${token}`;

  // Enviar email de convite
  await sendEmail({
    to: user.email,
    subject: "Convite - EsferaORDO | Defina sua senha",
    html: createInviteEmailTemplate({
      userName: user.email.split("@")[0],
      inviteLink,
      expiresInHours: 48,
    }),
  });

  console.log(`[User Invite] Convite reenviado para: ${user.email}`);

  return {
    inviteSent: true,
  };
}
