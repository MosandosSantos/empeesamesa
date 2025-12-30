import { NextRequest, NextResponse } from "next/server";
import { getUserFromPayload, verifyAuth } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { payload, error } = await verifyAuth(request);
    if (error) return error;

    const user = await getUserFromPayload(payload!);
    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Somente admin" }, { status: 403 });
    }

    const body = await request.json();
    const password = body?.password as string | undefined;
    if (!password) {
      return NextResponse.json({ error: "Senha obrigatoria" }, { status: 400 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "Usuario sem senha definida" }, { status: 400 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("POST /api/admin/verify-password error:", err);
    return NextResponse.json({ error: "Erro ao validar senha" }, { status: 500 });
  }
}
