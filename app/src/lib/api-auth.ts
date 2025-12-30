import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie, JWTPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Middleware helper to verify JWT token and extract tenant info
 * Returns null if authentication fails, otherwise returns the JWT payload
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ payload: JWTPayload; error: null } | { payload: null; error: NextResponse }> {
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    return {
      payload: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      payload: null,
      error: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
    };
  }

  return { payload, error: null };
}

export async function authenticateRequest(request: NextRequest) {
  const { payload, error } = await verifyAuth(request);
  if (error) return null;
  return payload;
}

export async function getUserFromPayload(payload: JWTPayload) {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (user && user.tenantId === payload.tenantId) {
    return user;
  }

  const fallback = await prisma.user.findFirst({
    where: {
      email: payload.email,
      tenantId: payload.tenantId,
    },
  });

  if (fallback) {
    return fallback;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const devFallback = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  return devFallback ?? null;
}
