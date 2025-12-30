import { randomBytes, createHash } from 'crypto';
import prisma from '@/lib/prisma';

const TOKEN_EXPIRY_HOURS = 48;

/**
 * Gera um token aleatório seguro
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Cria hash de um token para armazenamento seguro
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Cria um token de convite para um usuário
 */
export async function createInviteToken(userId: string): Promise<string> {
  // Gerar token único
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Calcular expiração
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  // Salvar no banco
  await prisma.passwordInviteToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

/**
 * Valida um token de convite
 * Retorna o userId se válido, ou null se inválido/expirado/usado
 */
export async function validateInviteToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);

  const inviteToken = await prisma.passwordInviteToken.findUnique({
    where: { tokenHash },
  });

  if (!inviteToken) {
    return null; // Token não encontrado
  }

  if (inviteToken.usedAt) {
    return null; // Token já foi usado
  }

  if (inviteToken.expiresAt < new Date()) {
    return null; // Token expirado
  }

  return inviteToken.userId;
}

/**
 * Marca um token como usado
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  await prisma.passwordInviteToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  });
}

/**
 * Invalida todos os tokens de convite de um usuário
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  await prisma.passwordInviteToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });
}

export const INVITE_TOKEN_EXPIRY_HOURS = TOKEN_EXPIRY_HOURS;
